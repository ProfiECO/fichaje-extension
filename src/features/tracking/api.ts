import type {
  Checkin,
  CheckinDocument,
  Employee,
  HrSettings
} from '@/shared/types.ts'

type Filter = [string, '=' | '<' | '>=', string]

import { authed, csrfToken, request } from '@/shared/api/frappe.ts'
import { toServer, weekStart } from '@/shared/lib/time.ts'

const CHECKIN = '/api/resource/Employee%20Checkin'

export const getEmployee = () =>
  authed(
    async (d) =>
      (
        await request<{ message: Employee | null }>(
          d,
          '/api/method/hrms.api.get_current_employee_info'
        )
      ).message
  )
export const getHrSettings = () =>
  authed(
    async (d) =>
      (
        await request<{ message: HrSettings | null }>(
          d,
          '/api/method/hrms.api.get_hr_settings'
        )
      ).message
  )

export function getCheckins(
  employee: string,
  filters: Filter[],
  {
    order = 'time asc',
    limit = 0
  }: { order?: 'time asc' | 'time desc'; limit?: number } = {}
) {
  return authed(async (domain) => {
    const logs: Checkin[] = []
    const pageSize = limit || 500
    for (let start = 0; ; start += pageSize) {
      const query = new URLSearchParams({
        fields: JSON.stringify(['name', 'log_type', 'time']),
        filters: JSON.stringify([['employee', '=', employee], ...filters]),
        order_by: `${order}, name ${order.endsWith('desc') ? 'desc' : 'asc'}`,
        limit_page_length: String(pageSize),
        limit_start: String(start)
      })
      const { data } = await request<{ data: Checkin[] }>(
        domain,
        `${CHECKIN}?${query}`
      )
      if (!Array.isArray(data))
        throw new Error('Respuesta de fichajes no válida.')
      logs.push(...data)
      if (limit || data.length < pageSize) return logs
    }
  })
}

export async function getWeekCheckins(employee: string, reference: Date) {
  const start = weekStart(reference)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const [previous, logs] = await Promise.all([
    getCheckins(employee, [['time', '<', toServer(start)]], {
      order: 'time desc',
      limit: 1
    }),
    getCheckins(employee, [
      ['time', '>=', toServer(start)],
      ['time', '<', toServer(end)]
    ])
  ])
  return [...previous, ...logs]
}

export const createCheckin = (doc: CheckinDocument) =>
  authed(async (domain) =>
    request(domain, CHECKIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': await csrfToken(domain)
      },
      body: JSON.stringify(doc)
    })
  )
