import { weekStart, sameDay } from '../../shared/lib/time.js';
import * as api from './api.js';

export async function loadDashboard(reference = new Date()) {
  const employee = await api.getEmployee();
  if (!employee?.name)
    throw new Error('Tu usuario no tiene un empleado activo en Frappe HR.');
  const [settings, logs, last, currentLogs] = await Promise.all([
    api.getHrSettings(),
    api.getWeekCheckins(employee.name, reference),
    api.getCheckins(employee.name, [], { order: 'time desc', limit: 1 }),
    sameDay(weekStart(reference), weekStart(new Date()))
      ? Promise.resolve(null)
      : api.getWeekCheckins(employee.name, new Date()),
  ]);
  if (!settings || typeof settings !== 'object')
    throw new Error(
      'No se pudieron leer los ajustes de Frappe HR. Actualiza antes de fichar.',
    );
  return {
    employee,
    settings,
    logs,
    currentLogs: currentLogs ?? logs,
    last: last[0] ?? null,
    syncedAt: new Date(),
  };
}
