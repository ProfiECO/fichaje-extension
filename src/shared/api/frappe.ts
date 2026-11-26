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
export const login = (domain: string, usr: string, pwd: string) =>
  request(domain, '/api/method/login', {
    method: 'POST',
    body: new URLSearchParams({ usr, pwd })
  })
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
    signal: AbortSignal.timeout(20000)
  })
  if (!res.ok)
    throw new HttpError('No se pudo validar la sesión para fichar.', res.status)
  const html = await res.text()
  return html.match(/csrf_token\s*[:=]\s*["']([^"']+)["']/)?.[1] ?? ''
}
