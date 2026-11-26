import type { Checkin } from '@/shared/types.ts'
// Frappe returns naive datetimes ("YYYY-MM-DD HH:mm:ss").
// shortcut: assumes browser timezone = server timezone, read the system timezone if they ever differ.
export const parse = (s: string) => new Date(s.replace(' ', 'T'))

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const toServer = (d: Date) =>
  `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

export function weekStart(now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
  return d
}

// logs: [{log_type: "IN"|"OUT", time}] sorted ascending. Returns 7 days Mon..Sun with worked ms.
export function weekSummary(logs: Checkin[], now: Date, reference = now) {
  const start = weekStart(reference)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return { date, ms: 0 }
  })
  const add = (from: Date, to: Date) => {
    for (const day of days) {
      const next = new Date(day.date)
      next.setDate(next.getDate() + 1)
      const a = Math.max(from.getTime(), day.date.getTime()),
        b = Math.min(to.getTime(), next.getTime())
      if (b > a) day.ms += b - a
    }
  }
  let open: Date | null = null
  for (const log of logs) {
    const t = parse(log.time)
    if (!Number.isFinite(t.getTime()) || t > now) continue
    if (log.log_type === 'IN')
      open ??= t // repeated IN keeps the first one
    else if (log.log_type === 'OUT' && open) {
      add(open, t)
      open = null
    }
  }
  if (open) add(open, now)
  return days
}

export const duration = (ms: number) => {
  const m = Math.floor(Math.max(0, ms) / 60000)
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`
}

export const clock = (ms: number) => {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

export const HOUR = 3600000
export const dateKey = (date: Date) => toServer(date).slice(0, 10)
export const sameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b)
export const shortDate = (date: Date) =>
  date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
export const hour = (date: Date) =>
  date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
export function shiftWeek(date: Date, count: number) {
  const next = weekStart(date)
  next.setDate(next.getDate() + count * 7)
  return next
}
