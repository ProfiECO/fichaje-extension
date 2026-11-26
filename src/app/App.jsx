import { useExtension } from './useExtension.js';
import ConnectionForm from '../features/connection/ConnectionForm.jsx';
import PreferencesPanel from '../features/preferences/PreferencesPanel.jsx';
import TodayPanel from '../features/tracking/TodayPanel.jsx';
import WeekPanel from '../features/tracking/WeekPanel.jsx';
import Icon from '../shared/ui/Icon.jsx';
import { hour } from '../shared/lib/time.js';

const sections = [
  ['today', 'Hoy'],
  ['week', 'Semana'],
  ['history', 'Historial'],
  ['settings', 'Ajustes'],
];
export default function App() {
  const app = useExtension();
  const { config, data, tab, setTab, busy, error, notice } = app;
  return (
    <main className="px-[22px] pt-[22px]">
      <header className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-white dark:bg-emerald-200 dark:text-emerald-950">
            <Icon name="clock" size={21} />
          </span>
          <div className="text-[21px] leading-tight font-bold tracking-tight">
            fichaje
            <span className="mt-0.5 block text-[8px] font-semibold tracking-[2px] text-muted">
              FRAPPE HR
            </span>
          </div>
        </div>
        <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
          v{__APP_VERSION__}
        </span>
      </header>
      {error && (
        <div
          className="mb-3.5 rounded-lg border border-danger/20 bg-danger/10 p-3 text-[11px] wrap-anywhere text-danger"
          role="alert"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          className="mb-3.5 rounded-lg bg-soft p-3 text-[11px] text-accent"
          role="status"
        >
          {notice}
        </div>
      )}
      {config === undefined ? (
        <div className="px-3 py-8 text-center" role="status">
          Preparando tu espacio…
        </div>
      ) : !config ? (
        <ConnectionForm busy={busy} connect={app.connect} />
      ) : (
        <>
          <section className="flex items-center gap-2.5 border-t border-line py-4">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-xs font-semibold text-accent">
              {(data?.employee.employee_name || config.usr)
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-semibold">
                {data?.employee.employee_name || config.usr}
              </strong>
              <a
                className="flex items-center gap-1 text-[11px] text-muted hover:underline"
                href={`${config.domain}/hrms`}
                target="_blank"
                rel="noreferrer"
              >
                {new URL(config.domain).host}
                <Icon name="external" size={11} />
              </a>
            </div>
            <button
              className={`btn-icon ${busy ? '[&>svg]:animate-spin' : ''}`}
              title="Actualizar datos"
              aria-label="Actualizar datos"
              disabled={busy}
              onClick={() => app.perform(() => app.sync())}
            >
              <Icon name="refresh" />
            </button>
          </section>
          <nav
            className="mb-5 flex gap-1 rounded-xl border border-line bg-surface p-1"
            aria-label="Secciones"
          >
            {sections.map(([value, label]) => (
              <button
                key={value}
                aria-current={tab === value ? 'page' : undefined}
                className={`flex-1 rounded-lg px-1 py-2 text-xs font-medium ${tab === value ? 'bg-soft text-accent' : 'text-muted hover:text-ink'}`}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </nav>
          {!data && tab !== 'settings' ? (
            <section className="px-3 py-8 text-center">
              <Icon name="clock" size={30} />
              <h2 className="my-2.5 text-lg font-semibold">
                {busy ? 'Sincronizando…' : 'Vamos a conectar'}
              </h2>
              <p className="text-muted">
                {busy
                  ? 'Consultando tus fichajes en Frappe HR.'
                  : 'Pulsa Actualizar para volver a cargar tus datos o revisa tu cuenta en Ajustes.'}
              </p>
            </section>
          ) : (
            <>
              {tab === 'today' && data && <TodayPanel {...app} />}
              {(tab === 'week' || tab === 'history') && data && (
                <WeekPanel
                  {...app}
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
                />
              )}
            </>
          )}
          <footer className="flex justify-between gap-2 py-4 text-[9px] text-muted">
            <span>
              {busy
                ? 'Sincronizando…'
                : data
                  ? `Actualizado a las ${hour(data.syncedAt)}`
                  : 'Pendiente de sincronizar'}
            </span>
            <span>Hora del navegador</span>
          </footer>
        </>
      )}
    </main>
  );
}
