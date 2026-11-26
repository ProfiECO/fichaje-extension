import { useState } from 'react';

export default function PreferencesPanel({
  preferences,
  busy,
  save,
  disconnect,
}) {
  const [saved, setSaved] = useState(false);
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">A tu ritmo</h2>
      <p className="mt-2 mb-5 text-[11px] text-muted">
        Objetivos orientativos para tu seguimiento. No modifican tu jornada en
        Frappe HR.
      </p>
      <form
        onSubmit={async (event) => {
          setSaved(false);
          if (await save(event)) setSaved(true);
        }}
        onChange={() => setSaved(false)}
      >
        <div className="grid grid-cols-2 gap-3">
          <label>
            Horas al día
            <input
              name="dailyHours"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              required
              defaultValue={preferences.dailyHours}
            />
          </label>
          <label>
            Horas por semana
            <input
              name="weeklyHours"
              type="number"
              min="0.5"
              max="168"
              step="0.5"
              required
              defaultValue={preferences.weeklyHours}
            />
          </label>
        </div>
        <button className="btn-primary" disabled={busy}>
          Guardar objetivos
        </button>
        {saved && (
          <p
            className="mt-2 rounded-lg bg-soft p-2 text-[11px] text-accent"
            role="status"
          >
            Objetivos guardados.
          </p>
        )}
      </form>
      <div className="mt-6 border-t border-line pt-5">
        <strong className="text-xs font-semibold">Cuenta conectada</strong>
        <p className="mt-1.5 mb-3 text-[11px] text-muted">
          Olvida las credenciales en esta extensión. La sesión de la web
          permanece abierta.
        </p>
        <button
          className="rounded-lg border border-line px-3 py-2 text-[11px] text-danger"
          onClick={disconnect}
          disabled={busy}
        >
          Desconectar cuenta
        </button>
      </div>
    </section>
  );
}
