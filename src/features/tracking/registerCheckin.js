import { createCheckin } from './api.js';
import { position } from '../../shared/lib/geolocation.js';
import { toServer } from '../../shared/lib/time.js';

export async function registerCheckin({ data, sync, setNotice, setNeedsSync }) {
  const expected = data.last;
  const fresh = await sync();
  if (
    expected?.name !== fresh.last?.name ||
    expected?.time !== fresh.last?.time ||
    expected?.log_type !== fresh.last?.log_type
  ) {
    setNotice(
      'Tus fichajes han cambiado. Revisa el estado actualizado antes de fichar.',
    );
    return;
  }
  const coordinates = fresh.settings?.allow_geolocation_tracking
    ? await position()
    : {};
  setNeedsSync(true);
  try {
    await createCheckin({
      employee: fresh.employee.name,
      log_type: fresh.last?.log_type === 'IN' ? 'OUT' : 'IN',
      time: toServer(new Date()),
      ...coordinates,
    });
  } catch (err) {
    throw new Error(
      `${err.message} Actualiza antes de volver a fichar para comprobar si se ha registrado.`,
    );
  }
  setNotice('Fichaje registrado correctamente.');
  try {
    await sync();
  } catch {
    throw new Error(
      'El fichaje se ha guardado, pero no se pudo actualizar la vista. Pulsa Actualizar.',
    );
  }
}
