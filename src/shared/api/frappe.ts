import { HttpError } from '@/shared/lib/errors.ts'
import { getConfig } from '@/shared/lib/storage.ts'

type ServerError = { message?: unknown; _server_messages?: string }
function serverMessage(data: ServerError) {
  try {
    const messages: string[] = JSON.parse(data._server_messages || '[]').map(
      (message: string) => JSON.parse(message).message
    )
    if (messages.length) return messages.join(' ').replace(/<[^>]+>/g, '')
  } catch {
    /* Fall back to a plain error. */
  }
  return typeof data.message === 'string'
    ? data.message.replace(/<[^>]+>/g, '')
    : null
}
export async function request<T>(
  domain: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response
  try {
    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')
    res = await fetch(domain + path, {
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
      ...options,
      headers
    })
  } catch {
    throw new Error(
      'No se pudo conectar con Frappe HR. Revisa tu conexión y actualiza los datos.'
    )
  }
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data && typeof data === 'object' ? serverMessage(data) : null
    throw new HttpError(
      detail ||
        `Error HTTP ${res.status}. Revisa tu sesión y tus permisos en Frappe HR.`,
      res.status
    )
  }
  if (!data)
    throw new Error(
      'El servidor no devolvió JSON. Comprueba el dominio y tu sesión.'
    )
  return data as T
}
// Never start a second login while the browser already has the requested session.
async function loggedUser(domain: string): Promise<string | null> {
  try {
    const { message } = await request<{ message?: string }>(
      domain,
      '/api/method/frappe.auth.get_logged_user'
    )
    return message && message !== 'Guest' ? message : null
  } catch (error) {
    if (
      error instanceof HttpError &&
      (error.status === 401 || error.status === 403)
    )
      return null
    throw error
  }
}
function sameUser(actual: string, expected: string) {
  return actual.trim().toLowerCase() === expected.trim().toLowerCase()
}
export async function login(domain: string, usr: string, pwd: string) {
  const current = await loggedUser(domain)
  if (current) {
    if (!sameUser(current, usr))
      throw new Error(
        `La web de Frappe tiene abierta la cuenta ${current}. Conecta esa misma cuenta en la extensión o cambia de cuenta en la web.`
      )
    return
  }
  const result = await request<{ message?: string }>(
    domain,
    '/api/method/login',
    {
      method: 'POST',
      body: new URLSearchParams({ usr, pwd })
    }
  )
  if (result.message !== 'Logged In' && result.message !== 'No App') {
    throw new Error(
      'Frappe requiere completar el acceso en la web (por ejemplo, verificación en dos pasos). Inicia sesión allí y vuelve a conectar la extensión.'
    )
  }
}
export async function ensureAccount() {
  const config = await getConfig()
  if (!config) throw new Error('Conecta tu cuenta para continuar.')
  await login(config.domain, config.usr, config.pwd)
}
let renewing: Promise<unknown> | null = null
export async function authed<T>(
  fn: (domain: string) => Promise<T>
): Promise<T> {
  const config = await getConfig()
  if (!config) throw new Error('Conecta tu cuenta para continuar.')
  try {
    return await fn(config.domain)
  } catch (err) {
    if (
      !(err instanceof HttpError) ||
      (err.status !== 401 && err.status !== 403)
    )
      throw err
    const current = await loggedUser(config.domain)
    if (current) {
      if (!sameUser(current, config.usr))
        throw new Error(
          'La cuenta abierta en Frappe ha cambiado. Vuelve a conectar la extensión con la misma cuenta.'
        )
      throw err
    }
    if (!renewing)
      renewing = login(config.domain, config.usr, config.pwd).finally(() => {
        renewing = null
      })
    await renewing
    return fn(config.domain)
  }
}
export async function csrfToken(domain: string) {
  const res = await fetch(`${domain}/hrms`, {
    credentials: 'include',
    cache: 'no-store',
    signal: AbortSignal.timeout(20000)
  })
  if (!res.ok)
    throw new HttpError('No se pudo validar la sesión para fichar.', res.status)
  const html = await res.text()
  return html.match(/csrf_token\s*[:=]\s*["']([^"']+)["']/)?.[1] ?? ''
}
