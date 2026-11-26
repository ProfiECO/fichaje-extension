import {
  clock,
  duration,
  hour,
  HOUR,
  parse,
  sameDay,
  shortDate,
  weekSummary,
} from '../../shared/lib/time.js';
import Icon from '../../shared/ui/Icon.jsx';
import Meter from '../../shared/ui/Meter.jsx';

export default function TodayPanel({
  data,
  now,
  preferences,
  busy,
  needsSync,
  checkin,
}) {
  const inside = data.last?.log_type === 'IN';
  const days = weekSummary(data.currentLogs, now);
  const today = days.find((day) => sameDay(day.date, now));
  const goal = preferences.dailyHours * HOUR;
  return (
    <section>
      <div className="flex items-center justify-between gap-1.5">
        <span className="eyebrow text-[9px] tracking-[.08em]">
          {now.toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </span>
        <span
          className={`flex items-center gap-1.5 text-[10px] whitespace-nowrap ${inside ? 'text-accent' : 'text-muted'}`}
        >
          <i
            className={`size-1.5 rounded-full ${inside ? 'bg-accent ring-3 ring-soft' : 'bg-muted'}`}
          />
          {inside ? 'En jornada' : 'Fuera de jornada'}
        </span>
      </div>
      <div className="card mt-4 px-5 pt-6 pb-5 text-center shadow-sm shadow-black/2">
        <span className="text-[11px] text-muted">
          {inside ? 'Tiempo de esta sesión' : 'Tiempo trabajado hoy'}
        </span>
        <div className="my-1.5 text-5xl leading-[1.3] font-semibold tracking-[-2px] tabular-nums">
          {clock(inside ? now - parse(data.last.time) : (today?.ms ?? 0))}
        </div>
        <p className="text-[11px] text-muted">
          {data.last
            ? `${inside ? 'Entrada' : 'Última salida'} · ${shortDate(parse(data.last.time))}, ${hour(parse(data.last.time))}`
            : 'Tu próximo fichaje empieza aquí'}
        </p>
        <button
          className={`btn-primary mt-5 ${inside ? 'bg-[#2e4340] dark:bg-[#38554b] dark:text-emerald-50' : ''}`}
          disabled={busy || needsSync}
          onClick={checkin}
        >
          <Icon name={inside ? 'arrow' : 'clock'} />
          {busy
            ? 'Comprobando…'
            : inside
              ? 'Registrar salida'
              : 'Registrar entrada'}
        </button>
      </div>
      {needsSync && (
        <p className="mt-2.5 text-[11px] text-muted">
          Actualiza los datos para comprobar el último fichaje antes de
          continuar.
        </p>
      )}
      <div className="my-6">
        <div className="mb-2.5 flex items-center justify-between text-[11px]">
          <span>Total de hoy</span>
          <strong className="font-semibold">
            {duration(today?.ms ?? 0)}{' '}
            <span className="font-normal text-muted">
              / {preferences.dailyHours} h
            </span>
          </strong>
        </div>
        <Meter value={today?.ms ?? 0} goal={goal} label="Objetivo diario" />
        <p className="mt-2.5 text-[10px] text-muted">
          {(today?.ms ?? 0) >= goal
            ? 'Has alcanzado tu objetivo diario.'
            : `${duration(goal - (today?.ms ?? 0))} para tu objetivo diario`}
        </p>
      </div>
      <div className="card grid grid-cols-2 divide-x divide-line py-4">
        <div className="px-4">
          <span className="block text-[10px] text-muted">Esta semana</span>
          <strong className="mt-0.5 block text-xl font-semibold tracking-tight tabular-nums">
            {duration(days.reduce((sum, day) => sum + day.ms, 0))}
          </strong>
        </div>
        <div className="px-4">
          <span className="block text-[10px] text-muted">Objetivo semanal</span>
          <strong className="mt-0.5 block text-xl font-semibold tracking-tight">
            {preferences.weeklyHours}
            <small className="text-[11px] font-normal tracking-normal text-muted">
              {' '}
              horas
            </small>
          </strong>
        </div>
      </div>
    </section>
  );
}
