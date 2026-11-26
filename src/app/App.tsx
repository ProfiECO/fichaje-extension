import { useEffect, useRef } from 'react'
import { type Section, useExtension } from '@/app/useExtension.ts'
import ConnectionForm from '@/features/connection/ConnectionForm.tsx'
import PreferencesPanel from '@/features/preferences/PreferencesPanel.tsx'
import TodayPanel from '@/features/tracking/TodayPanel.tsx'
import WeekPanel from '@/features/tracking/WeekPanel.tsx'
import { hour } from '@/shared/lib/time.ts'
import Icon from '@/shared/ui/Icon.tsx'

const sections: [Section, string][] = [
  ['today', 'Hoy'],
  ['week', 'Semana'],
  ['history', 'Historial']
]
export default function App() {
  const app = useExtension()
  const { config, data, tab, setTab, busy, error, notice } = app
  const scrollRef = useRef<HTMLElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset scroll on section changes only.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [tab])
  return (
    <div className='app-shell'>
      <header className='flex items-center justify-between gap-3 px-5 py-4'>
        <div
          className='flex items-center gap-2.5'
          title={`Frappe HR · v${__APP_VERSION__}`}
        >
          <Icon name='clock' size={18} />
          <span className='text-sm font-semibold'>Fichaje</span>
        </div>
        {config && (
          <div className='flex items-center gap-1'>
            <button
              type='button'
              className={`btn-icon ${busy ? '[&>svg]:animate-spin' : ''}`}
              title='Actualizar datos'
              aria-label='Actualizar datos'
              disabled={busy}
              onClick={() => app.perform(() => app.sync())}
            >
              <Icon name='refresh' size={17} />
            </button>
            <button
              type='button'
              className={`btn-icon ${tab === 'settings' ? 'bg-soft text-accent' : ''}`}
              title='Ajustes'
              aria-pressed={tab === 'settings'}
              onClick={() => setTab(tab === 'settings' ? 'today' : 'settings')}
            >
              <Icon name='settings' size={17} />
              <span className='sr-only'>Ajustes</span>
            </button>
          </div>
        )}
      </header>
      {config && (
        <nav
          className='mx-5 mb-1 flex gap-4 border-b border-line'
          aria-label='Secciones'
        >
          {sections.map(([value, label]) => (
            <button
              type='button'
              key={value}
              aria-current={tab === value ? 'page' : undefined}
              className={`min-h-9 flex-1 border-b-2 px-1 text-xs font-medium ${tab === value ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      <main
        ref={scrollRef}
        className='app-scroll px-5 pt-5 pb-4'
        aria-label='Contenido de fichaje'
        // biome-ignore lint/a11y/noNoninteractiveTabindex: The scroll region must be keyboard-scrollable.
        tabIndex={0}
      >
        {error && (
          <div
            className='notice border-danger/15 bg-danger/8 text-danger'
            role='alert'
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            className='notice border-accent/15 bg-soft text-accent'
            role='status'
          >
            {notice}
          </div>
        )}
        {config === undefined ? (
          <div className='empty-state' role='status'>
            Preparando tu espacio…
          </div>
        ) : !config ? (
          <ConnectionForm
            busy={busy}
            connect={app.connect}
            initialValues={app.connectionDraft}
          />
        ) : !data && tab !== 'settings' ? (
          <section className='empty-state'>
            <span className='mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-soft text-accent'>
              <Icon name='refresh' size={22} />
            </span>
            <h1 className='text-lg font-semibold'>
              {busy ? 'Sincronizando…' : 'No pudimos cargar tu jornada'}
            </h1>
            <p className='mt-2 text-xs text-muted'>
              {busy
                ? 'Un momento, estamos consultando tus fichajes.'
                : 'Actualiza los datos o revisa tu cuenta en Ajustes.'}
            </p>
          </section>
        ) : (
          <div key={tab} className='min-w-0'>
            {tab === 'today' && data && (
              <TodayPanel
                data={data}
                now={app.now}
                preferences={app.preferences}
                busy={busy}
                needsSync={app.needsSync}
                checkin={app.checkin}
              />
            )}
            {(tab === 'week' || tab === 'history') && data && (
              <WeekPanel
                data={data}
                reference={app.reference}
                now={app.now}
                preferences={app.preferences}
                busy={busy}
                navigate={(date) => app.perform(() => app.sync(date))}
                showHistory={tab === 'history'}
              />
            )}
            {tab === 'settings' && (
              <PreferencesPanel
                preferences={app.preferences}
                busy={busy}
                save={app.savePreferences}
                disconnect={app.disconnect}
                config={config}
              />
            )}
          </div>
        )}
      </main>
      <footer className='flex min-w-0 items-center justify-between gap-3 border-t border-line px-5 py-3 text-[10px] text-muted'>
        <span className='min-w-0 truncate' title={config?.usr}>
          {config ? data?.employee.employee_name || config.usr : 'Frappe HR'}
        </span>
        <span
          className='flex shrink-0 items-center gap-1.5'
          title={
            config
              ? 'Actualiza para consultar cambios de otros dispositivos'
              : 'Credenciales guardadas solo en este navegador'
          }
        >
          <i
            aria-hidden='true'
            className={`size-1 rounded-full ${busy ? 'bg-muted animate-pulse' : 'bg-accent'}`}
          />
          {config
            ? busy
              ? 'Sincronizando…'
              : data
                ? `Actualizado ${hour(data.syncedAt)}`
                : 'Sin sincronizar'
            : 'Datos locales'}
        </span>
      </footer>
    </div>
  )
}
