import { getConfig } from '../lib/storage.js';

function serverMessage(data) {
  try {
    const messages = JSON.parse(data._server_messages || '[]').map(
      (message) => JSON.parse(message).message,
    );
    if (messages.length) return messages.join(' ').replace(/<[^>]+>/g, '');
  } catch {
    /* Fall back to a safe, plain error. */
  }
  return typeof data.message === 'string'
    ? data.message.replace(/<[^>]+>/g, '')
    : null;
}

export async function request(domain, path, options = {}) {
  let res;
  try {
    res = await fetch(domain + path, {
      credentials: 'include',
      signal: AbortSignal.timeout(20000),
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
    });
  } catch {
    throw new Error(
      'No se pudo conectar con Frappe HR. Revisa tu conexión y actualiza los datos.',
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(
      (data && serverMessage(data)) ||
        `Error HTTP ${res.status}. Revisa tu sesión y tus permisos en Frappe HR.`,
    );
    err.status = res.status;
    throw err;
  }
  if (!data)
    throw new Error(
      'El servidor no devolvió JSON. Comprueba el dominio y tu sesión.',
    );
  return data;
}

export const login = (domain, usr, pwd) =>
  request(domain, '/api/method/login', {
    method: 'POST',
    body: new URLSearchParams({ usr, pwd }),
  });

let renewing;
export async function authed(fn) {
  const config = await getConfig();
  if (!config) throw new Error('Conecta tu cuenta para continuar.');
  try {
    return await fn(config.domain);
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) throw err;
    // Parallel reads share the same session renewal.
    if (!renewing)
      renewing = login(config.domain, config.usr, config.pwd).finally(() => {
        renewing = null;
      });
    await renewing;
    return fn(config.domain);
  }
}

export async function csrfToken(domain) {
  const res = await fetch(`${domain}/hrms`, {
    credentials: 'include',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const err = new Error('No se pudo validar la sesión para fichar.');
    err.status = res.status;
    throw err;
  }
  const html = await res.text();
  return html.match(/csrf_token\s*[:=]\s*["']([^"']+)["']/)?.[1] ?? '';
}
