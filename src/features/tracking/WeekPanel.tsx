import { downloadCheckinsCsv, downloadCsv } from '@/features/tracking/export.ts'
import {
  dateKey,
  duration,
  HOUR,
  hour,
  parse,
  sameDay,
  shiftWeek,
  shortDate,
  weekStart,
  weekSummary
} from '@/shared/lib/time.ts'
import type { Checkin, Dashboard, Preferences } from '@/shared/types.ts'
import Icon from '@/shared/ui/Icon.tsx'
import Meter from '@/shared/ui/Meter.tsx'

interface Props {
  data: Dashboard
  reference: Date
  now: Date
  preferences: Preferences
  busy: boolean
  navigate: (date: Date) => void
  showHistory: boolean
}
function Records({ logs }: { logs: Checkin[] }) {
  return (
    <ol className='divide-y divide-line'>
      {logs.map((log) => (
        <li
          key={log.name ?? `${log.time}-${log.log_type}`}
          className='flex items-center justify-between gap-3 py-2 text-xs'
        >
          <span className='flex min-w-0 items-center gap-2'>
            <Icon name='arrow' size={13} />
            {log.log_type === 'IN'
              ? 'Entrada'
              : log.log_type === 'OUT'
                ? 'Salida'
                : 'Sin tipo'}
          </span>
          <time
            className='text-muted tabular-nums'
            dateTime={log.time.replace(' ', 'T')}
          >
            {hour(parse(log.time))}
          </time>
        </li>
      ))}
    </ol>
  )
}
export default function WeekPanel({
  data,
  reference,
  now,
  preferences,
  busy,
  navigate,
  showHistory
}: Props) {
  const days = weekSummary(data.logs, now, reference)
  const total = days.reduce((sum, day) => sum + day.ms, 0)
  const goal = preferences.weeklyHours * HOUR
  const currentWeek = sameDay(reference, weekStart(now))
  const end = shiftWeek(reference, 1)
  const lastDay = new Date(end)
  lastDay.setDate(lastDay.getDate() - 1)
  const history = data.logs.filter(
    (log) =>
      dateKey(parse(log.time)) >= dateKey(reference) &&
      dateKey(parse(log.time)) < dateKey(end)
  )
  return (
    <section>
      <div className='mb-5 flex items-center justify-between gap-2 text-center'>
        <button
          type='button'
          className='btn-icon'
          aria-label='Semana anterior'
          disabled={busy}
          onClick={() => navigate(shiftWeek(reference, -1))}
        >
          <Icon name='left' size={17} />
        </button>
        <div>
          <h1 className='text-xs font-semibold'>
            {shortDate(reference)} — {shortDate(lastDay)}{' '}
            <span className='font-normal text-muted'>
              · {reference.getFullYear()}
            </span>
          </h1>
          <button
            type='button'
            className='mt-1 text-[10px] text-accent disabled:text-muted disabled:opacity-100'
            disabled={busy || currentWeek}
            onClick={() => navigate(weekStart(new Date()))}
          >
            {currentWeek ? 'Esta semana' : 'Volver a hoy'}
          </button>
        </div>
        <button
          type='button'
          className='btn-icon'
          aria-label='Semana siguiente'
          disabled={busy || currentWeek}
          onClick={() => navigate(shiftWeek(reference, 1))}
        >
          <Icon name='right' size={17} />
        </button>
      </div>
      {showHistory ? (
        <>
          <div className='mb-3 flex items-center justify-between text-xs'>
            <h2 className='font-semibold'>Fichajes por día</h2>
            <span className='text-muted'>{history.length} fichajes</span>
          </div>
          {history.length ? (
            days
              .filter((day) =>
                history.some((log) => sameDay(parse(log.time), day.date))
              )
              .toReversed()
              .map((day) => (
                <div key={dateKey(day.date)} className='mb-3'>
                  <h3 className='border-b border-line py-1.5 text-[11px] font-medium text-muted capitalize'>
                    {day.date.toLocaleDateString('es', {
                      weekday: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <Records
                    logs={history
                      .filter((log) => sameDay(parse(log.time), day.date))
                      .toReversed()}
                  />
                </div>
              ))
          ) : (
            <p className='empty-state text-xs'>
              No hay fichajes en esta semana.
            </p>
          )}
        </>
      ) : (
        <>
          <div className='mb-4 border-b border-line pb-4'>
            <p className='text-[11px] text-muted'>Total semanal</p>
            <div className='mt-1 mb-3 flex items-baseline gap-2'>
              <strong className='text-[28px] font-medium tracking-tight tabular-nums'>
                {duration(total)}
              </strong>
              <span className='text-xs text-muted'>
                / {preferences.weeklyHours} h
              </span>
            </div>
            <Meter value={total} goal={goal} label='Objetivo semanal' />
            <p className='mt-2 text-[11px] text-muted'>
              {total >= goal
                ? `${duration(total - goal)} por encima del objetivo`
                : `${duration(goal - total)} pendientes para el objetivo`}
            </p>
          </div>
          <p className='mb-2 text-[10px] text-muted'>
            Abre un día para ver sus entradas y salidas.
          </p>
          <div className='divide-y divide-line'>
            {days.map((day) => {
              const logs = history.filter((log) =>
                sameDay(parse(log.time), day.date)
              )
              return (
                <details key={dateKey(day.date)} className='group'>
                  <summary className='flex min-h-10 list-none items-center justify-between gap-3 text-xs [&::-webkit-details-marker]:hidden'>
                    <span
                      className={`flex items-center gap-2 capitalize ${sameDay(day.date, now) ? 'font-semibold text-accent' : ''}`}
                    >
                      <span className='text-muted transition-transform group-open:rotate-90'>
                        <Icon name='right' size={12} />
                      </span>
                      {day.date.toLocaleDateString('es', {
                        weekday: 'short',
                        day: 'numeric'
                      })}
                      {sameDay(day.date, now) && (
                        <span className='text-[9px] font-normal'>hoy</span>
                      )}
                    </span>
                    <span className='tabular-nums'>{duration(day.ms)}</span>
                  </summary>
                  <div className='ps-5 pb-2'>
                    {logs.length ? (
                      <Records logs={logs} />
                    ) : (
                      <p className='py-2 text-[11px] text-muted'>
                        {day.ms
                          ? 'Incluye un turno iniciado antes de este día.'
                          : 'Sin fichajes.'}
                      </p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        </>
      )}
      <details className='mt-4 border-t border-line pt-3'>
        <summary className='text-xs font-medium text-muted'>
          Exportar datos
        </summary>
        <div className='mt-3 grid gap-2'>
          <button
            type='button'
            className='btn-secondary'
            disabled={busy}
            onClick={() => downloadCsv(data.logs, reference, now)}
          >
            <Icon name='download' size={14} />
            Exportar resumen CSV
          </button>
          <button
            type='button'
            className='btn-secondary'
            disabled={busy}
            onClick={() => downloadCheckinsCsv(data.logs, reference)}
          >
            <Icon name='download' size={14} />
            Exportar fichajes CSV
          </button>
        </div>
      </details>
    </section>
  )
}
