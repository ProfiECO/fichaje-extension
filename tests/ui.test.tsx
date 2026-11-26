// @vitest-environment jsdom
import assert from 'node:assert/strict'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { afterEach, test, vi } from 'vitest'
import App from '@/app/App.tsx'
import { toServer } from '@/shared/lib/time.ts'
import type { AccountConfig, Preferences } from '@/shared/types.ts'

type Store = { config?: AccountConfig; preferences?: Preferences }
type Options = {
  onLogin?: (url: string, fields: URLSearchParams) => void
  loginStatus?: number
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
function mount(
  initial: Store = {},
  { onLogin, loginStatus = 200 }: Options = {}
) {
  const saved = structuredClone(initial)
  vi.stubGlobal('chrome', {
    permissions: { request: async () => true },
    storage: {
      local: {
        get: async (key: keyof Store) => ({ [key]: saved[key] }),
        set: async (values: Partial<Store>) => Object.assign(saved, values),
        remove: async (key: keyof Store) => {
          delete saved[key]
        }
      }
    }
  })
  const start = new Date()
  start.setHours(8, 0, 0, 0)
  const end = new Date()
  end.setHours(9, 0, 0, 0)
  const logs = [
    { name: 'in-1', log_type: 'IN', time: toServer(start) },
    { name: 'out-1', log_type: 'OUT', time: toServer(end) }
  ]
  vi.stubGlobal('fetch', async (url: string, options?: RequestInit) => {
    if (url.endsWith('/api/method/login')) {
      onLogin?.(url, new URLSearchParams(String(options?.body)))
      return new Response(
        JSON.stringify({
          message:
            loginStatus === 200 ? 'Logged In' : 'Invalid login credentials'
        }),
        { status: loginStatus }
      )
    }
    let data: unknown
    if (url.includes('get_current_employee_info'))
      data = { message: { name: 'EMP-001', employee_name: 'Ana García' } }
    else if (url.includes('get_hr_settings'))
      data = { message: { allow_geolocation_tracking: 0 } }
    else {
      const params = new URL(url).searchParams
      const filters = JSON.parse(params.get('filters') || '[]') as string[][]
      const matches = logs.filter((log) =>
        filters.every(
          ([key, operator, value]) =>
            key !== 'time' ||
            (operator === '<' ? log.time < value : log.time >= value)
        )
      )
      data = {
        data:
          params.get('limit_page_length') === '1' ? matches.slice(-1) : matches
      }
    }
    return new Response(JSON.stringify(data))
  })
  render(<App />)
  return saved
}
const button = (name: string) =>
  screen.getByRole<HTMLButtonElement>('button', { name })
const field = (name: string) =>
  screen.getByLabelText<HTMLInputElement>(name, { exact: true })
async function ready() {
  await waitFor(() => assert.equal(button('Conectar cuenta').disabled, false))
}
function fillCredentials(password = 'test-only') {
  fireEvent.change(field('Dominio de Frappe HR'), {
    target: { value: 'https://hr.example.com' }
  })
  fireEvent.change(field('Usuario'), { target: { value: ' ana@example.com ' } })
  fireEvent.change(field('Contraseña'), { target: { value: password } })
}
test('renders the connection form when no configuration exists', async () => {
  mount()
  await ready()
  assert.equal(field('Contraseña').type, 'password')
  assert.ok(screen.getByText(/sin cifrar/))
  assert.equal(screen.queryByRole('navigation'), null)
})
test('loads an existing account, navigates features, saves goals and disconnects', async () => {
  const saved = mount({
    config: { domain: 'https://hr.example.com', usr: 'ana', pwd: 'test-only' }
  })
  await screen.findByText('Ana García')
  await waitFor(() => assert.equal(button('Registrar entrada').disabled, false))
  assert.equal(screen.queryByText('test-only'), null)
  fireEvent.click(button('Semana'))
  assert.ok(screen.getByRole('progressbar', { name: 'Objetivo semanal' }))
  fireEvent.click(button('Historial'))
  assert.ok(screen.getByText('2 fichajes'))
  fireEvent.click(button('Ajustes'))
  fireEvent.change(field('Horas al día'), { target: { value: '7.5' } })
  fireEvent.change(field('Horas por semana'), { target: { value: '37.5' } })
  fireEvent.click(button('Guardar objetivos'))
  await screen.findByText('Objetivos guardados.')
  assert.equal(saved.preferences?.dailyHours, 7.5)
  assert.equal(saved.preferences?.weeklyHours, 37.5)
  fireEvent.click(button('Desconectar cuenta'))
  await ready()
  assert.equal(saved.config, undefined)
  assert.equal(saved.preferences?.dailyHours, 7.5)
})
test('submits exact credentials including special password characters', async () => {
  const onLogin = vi.fn<(url: string, fields: URLSearchParams) => void>()
  const saved = mount({}, { onLogin })
  await ready()
  fillCredentials('a+B&= ñ 123')
  fireEvent.click(button('Conectar cuenta'))
  await screen.findByText('Ana García')
  const [url, fields] = onLogin.mock.calls[0]
  assert.equal(url, 'https://hr.example.com/api/method/login')
  assert.equal(fields.get('usr'), 'ana@example.com')
  assert.equal(fields.get('pwd'), 'a+B&= ñ 123')
  assert.equal(saved.config?.pwd, 'a+B&= ñ 123')
})
test('shows server rejection without saving credentials or clearing the form', async () => {
  const saved = mount({}, { loginStatus: 401 })
  await ready()
  fillCredentials()
  fireEvent.click(button('Conectar cuenta'))
  await screen.findByText('Invalid login credentials')
  assert.equal(saved.config, undefined)
  assert.equal(field('Usuario').value, ' ana@example.com ')
})
test('reveals the password without changing its value', async () => {
  mount()
  await ready()
  fillCredentials('synthetic-test-only')
  fireEvent.click(button('Mostrar contraseña'))
  assert.equal(field('Contraseña').type, 'text')
  assert.equal(field('Contraseña').value, 'synthetic-test-only')
  fireEvent.click(button('Ocultar contraseña'))
  assert.equal(field('Contraseña').type, 'password')
})
