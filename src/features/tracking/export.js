import {
  dateKey,
  weekStart,
  weekSummary,
  duration,
} from '../../shared/lib/time.js';

// Quote every cell, including formula-like values from external systems.
const csvCell = (value) =>
  `"${String(value)
    .replace(/^[=+@-]/, "'$&")
    .replaceAll('"', '""')}"`;
export function summaryCsv(logs, reference, now = new Date()) {
  const rows = [
    ['Fecha', 'Horas trabajadas', 'Minutos trabajados'],
    ...weekSummary(logs, now, reference).map(({ date, ms }) => [
      dateKey(date),
      duration(ms),
      Math.floor(ms / 60000),
    ]),
  ];
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

export function downloadCsv(logs, reference, now) {
  const url = URL.createObjectURL(
    new Blob([summaryCsv(logs, reference, now)], {
      type: 'text/csv;charset=utf-8;',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `fichaje-${dateKey(weekStart(reference))}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
