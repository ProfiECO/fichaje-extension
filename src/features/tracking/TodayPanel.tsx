import {
  clock,
  duration,
  HOUR,
  hour,
  parse,
  sameDay,
  weekSummary
} from '@/shared/lib/time.ts'
import type { Dashboard, Preferences } from '@/shared/types.ts'
import Meter from '@/shared/ui/Meter.tsx'

interface Props {
  data: Dashboard
  now: Date
  preferences: Preferences
  busy: boolean
  needsSync: boolean
  checkin: () => void
}
export default function TodayPanel({
  data,
  now,
  preferences,
  busy,
  needsSync,
  checkin
}: Props) {
  const inside = data.last?.log_type === 'IN'
  const days = weekSummary(data.currentLogs, now)
  const today = days.find((day) => sameDay(day.date, now))
  const total = today?.ms ?? 0
  const goal = preferences.dailyHours * HOUR
  return (
    <section>
      <div className='flex items-center justify-between gap-2'>
        <h1 className='text-xs text-muted capitalize'>
          {now.toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
          })}
        </h1>
        <span
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-medium ${inside ? 'bg-soft text-accent' : 'bg-inset text-muted'}`}
        >
          <i
            aria-hidden='true'
            className={`size-1.5 rounded-full ${inside ? 'bg-accent' : 'bg-muted'}`}
          />
          {inside ? 'En jornada' : 'Fuera de jornada'}
        </span>
      </div>
      <div className='py-7 text-center'>
        <p className='text-xs text-muted'>
          {inside ? 'Sesión en curso' : 'Tiempo de hoy'}
        </p>
        <div className='my-2 text-[44px] leading-tight font-medium tracking-[-2.5px] tabular-nums'>
          {clock(
            inside && data.last
              ? now.getTime() - parse(data.last.time).getTime()
              : total
          )}
        </div>
        <p className='min-h-4 text-[11px] text-muted'>
          {data.last
            ? `${inside ? 'Entrada' : 'Última salida'} a las ${hour(parse(data.last.time))}${sameDay(parse(data.last.time), now) ? '' : ` · ${parse(data.last.time).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`}`
            : 'Todo listo para empezar'}
        </p>
      </div>
      <button
        type='button'
        className={`btn-primary ${inside ? 'bg-ink text-surface' : ''}`}
        disabled={busy || needsSync}
        onClick={checkin}
      >
        {busy
          ? 'Comprobando…'
          : inside
            ? 'Registrar salida'
            : 'Registrar entrada'}
      </button>
      {needsSync && (
        <p className='mt-2 text-[11px] text-muted'>
          Actualiza para comprobar el último fichaje.
        </p>
      )}
      <div className='mt-6 border-t border-line pt-4'>
        <div className='mb-3 flex items-center justify-between text-xs'>
          <span className='text-muted'>Total de hoy</span>
          <strong className='font-semibold tabular-nums'>
            {duration(total)}
            <span className='font-normal text-muted'>
              {' '}
              / {preferences.dailyHours} h
            </span>
          </strong>
        </div>
        <Meter value={total} goal={goal} label='Objetivo diario' />
        <p className='mt-2.5 text-[10px] text-muted'>
          {total >= goal
            ? 'Objetivo diario completado'
            : `Te quedan ${duration(goal - total)} para tu objetivo`}
        </p>
      </div>
      <div className='mt-4 flex items-center justify-between px-0.5 text-[11px]'>
        <span className='text-muted'>Esta semana</span>
        <span className='font-medium tabular-nums'>
          {duration(days.reduce((sum, day) => sum + day.ms, 0))}
          <span className='font-normal text-muted'>
            {' '}
            / {preferences.weeklyHours} h
          </span>
        </span>
      </div>
    </section>
  )
}
