import {
  dateKey,
  duration,
  hour,
  HOUR,
  parse,
  sameDay,
  shortDate,
  shiftWeek,
  weekStart,
  weekSummary,
} from '../../shared/lib/time.js';
import Icon from '../../shared/ui/Icon.jsx';
import Meter from '../../shared/ui/Meter.jsx';
import { downloadCsv } from './export.js';

function History({ logs, reference }) {
  const history = logs
    .filter((log) => dateKey(parse(log.time)) >= dateKey(reference))
    .toReversed();
  return (
    <>
      <div className="mt-1 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Tu actividad</h2>
        <span className="text-[10px] text-muted">
          {history.length} fichajes
        </span>
      </div>
      {history.length ? (
        <ol className="max-h-80 overflow-y-auto divide-y divide-line">
          {history.map((log, i) => (
            <li
              className="flex items-center gap-2.5 py-3"
              key={log.name ?? `${log.time}-${i}`}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg ${log.log_type === 'IN' ? 'bg-soft text-accent [&>svg]:-rotate-45' : 'bg-line text-muted'}`}
              >
                <Icon name="arrow" size={15} />
              </span>
              <div className="flex-1">
                <strong className="block text-xs font-semibold">
                  {log.log_type === 'IN'
                    ? 'Entrada'
                    : log.log_type === 'OUT'
                      ? 'Salida'
                      : 'Sin tipo'}
                </strong>
                <span className="text-[10px] text-muted">
                  {shortDate(parse(log.time))}
                </span>
              </div>
              <time className="text-sm tabular-nums">
                {hour(parse(log.time))}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-3 py-8 text-center text-muted">
          No hay fichajes en esta semana.
        </p>
      )}
    </>
  );
}

export default function WeekPanel({
  data,
  reference,
  now,
  preferences,
  busy,
  navigate,
  showHistory,
}) {
  const days = weekSummary(data.logs, now, reference);
  const total = days.reduce((sum, day) => sum + day.ms, 0);
  const goal = preferences.weeklyHours * HOUR;
  const scale = Math.max(
    preferences.dailyHours * HOUR,
    ...days.map((day) => day.ms),
  );
  const currentWeek = sameDay(reference, weekStart(now));
  const end = new Date(reference);
  end.setDate(end.getDate() + 6);
  return (
    <section>
      <div className="mb-5 flex items-center justify-between text-center">
        <button
          className="btn-icon"
          aria-label="Semana anterior"
          disabled={busy}
          onClick={() => navigate(shiftWeek(reference, -1))}
        >
          <Icon name="left" />
        </button>
        <div>
          <strong className="block text-[13px] font-semibold">
            {shortDate(reference)} — {shortDate(end)}
          </strong>
          <button
            className="mx-auto block p-1 text-[10px] text-accent disabled:text-muted disabled:opacity-100"
            disabled={busy || currentWeek}
            onClick={() => navigate(weekStart(new Date()))}
          >
            {currentWeek ? 'Esta semana' : 'Volver a esta semana'}
          </button>
        </div>
        <button
          className="btn-icon"
          aria-label="Semana siguiente"
          disabled={busy || currentWeek}
          onClick={() => navigate(shiftWeek(reference, 1))}
        >
          <Icon name="right" />
        </button>
      </div>
      {showHistory ? (
        <History logs={data.logs} reference={reference} />
      ) : (
        <>
          <div className="card p-5">
            <span className="eyebrow">HORAS DE LA SEMANA</span>
            <strong className="mt-1 mb-3 block text-[32px] font-semibold tracking-tight tabular-nums">
              {duration(total)}
            </strong>
            <Meter value={total} goal={goal} label="Objetivo semanal" />
            <span className="mt-2 block text-[10px] text-muted">
              {Math.round((total / goal) * 100)}% de tu objetivo de{' '}
              {preferences.weeklyHours} h
            </span>
          </div>
          <ol className="pt-2 pb-3">
            {days.map((day) => (
              <li
                key={dateKey(day.date)}
                className={`grid grid-cols-[62px_1fr_65px] items-center gap-3 rounded-lg px-1.5 py-2 text-[11px] ${sameDay(day.date, now) ? 'bg-soft text-accent' : ''}`}
              >
                <span className="capitalize">
                  {day.date.toLocaleDateString('es', { weekday: 'short' })}
                  <small className="ml-1.5 text-[10px] text-muted">
                    {day.date.getDate()}
                  </small>
                </span>
                <Meter
                  value={day.ms}
                  goal={scale}
                  label={`Horas del ${shortDate(day.date)}`}
                />
                <strong className="text-right font-medium tabular-nums">
                  {duration(day.ms)}
                </strong>
              </li>
            ))}
          </ol>
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={() => downloadCsv(data.logs, reference, now)}
          >
            <Icon name="download" size={16} />
            Exportar resumen CSV
          </button>
        </>
      )}
    </section>
  );
}
