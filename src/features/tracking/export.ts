import {
  dateKey,
  duration,
  parse,
  shiftWeek,
  weekStart,
  weekSummary
} from '@/shared/lib/time.ts'
import type { Checkin } from '@/shared/types.ts'

const csvCell = (value: string | number) =>
  `"${String(value)
    .replace(/^[=+@-]/, "'$&")
    .replaceAll('"', '""')}"`
const serialize = (rows: (string | number)[][]) =>
  `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`
export function summaryCsv(logs: Checkin[], reference: Date, now = new Date()) {
  return serialize([
    ['Fecha', 'Horas trabajadas', 'Minutos trabajados'],
    ...weekSummary(logs, now, reference).map(({ date, ms }) => [
      dateKey(date),
      duration(ms),
      Math.floor(ms / 60000)
    ])
  ])
}
export function checkinsCsv(logs: Checkin[], reference: Date) {
  const start = dateKey(weekStart(reference))
  const end = dateKey(shiftWeek(reference, 1))
  return serialize([
    ['Fecha', 'Hora', 'Tipo'],
    ...logs
      .filter((log) => {
        const day = dateKey(parse(log.time))
        return day >= start && day < end
      })
      .map((log) => [
        dateKey(parse(log.time)),
        log.time.slice(11),
        log.log_type === 'IN'
          ? 'Entrada'
          : log.log_type === 'OUT'
            ? 'Salida'
            : 'Sin tipo'
      ])
  ])
}
function download(content: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8;' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const downloadCsv = (logs: Checkin[], reference: Date, now: Date) =>
  download(
    summaryCsv(logs, reference, now),
    `resumen-${dateKey(weekStart(reference))}.csv`
  )
export const downloadCheckinsCsv = (logs: Checkin[], reference: Date) =>
  download(
    checkinsCsv(logs, reference),
    `fichajes-${dateKey(weekStart(reference))}.csv`
  )
