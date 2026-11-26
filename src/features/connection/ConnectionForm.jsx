import Icon from '../../shared/ui/Icon.jsx';

export default function ConnectionForm({ busy, connect }) {
  return (
    <section className="pt-4 pb-5">
      <span className="eyebrow">TU TIEMPO, EN UN VISTAZO</span>
      <h1 className="my-4 text-4xl leading-[1.15] font-semibold tracking-tight">
        Tu jornada.
        <br />
        <span className="text-accent">Más sencilla.</span>
      </h1>
      <p className="max-w-72 text-xs leading-relaxed text-muted">
        Conecta con Frappe HR para fichar y seguir tus horas desde aquí.
      </p>
      <form className="mt-6" onSubmit={connect}>
        <label>
          Dominio de Frappe HR
          <input
            name="domain"
            type="url"
            placeholder="https://fichaje.tuempresa.com"
            required
            autoFocus
            disabled={busy}
          />
        </label>
        <label>
          Usuario
          <input
            name="usr"
            autoComplete="username"
            placeholder="tu@empresa.com"
            required
            disabled={busy}
          />
        </label>
        <label>
          Contraseña
          <input
            name="pwd"
            type="password"
            autoComplete="current-password"
            required
            disabled={busy}
          />
        </label>
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Conectando…' : 'Conectar cuenta'}
          <Icon name="arrow" />
        </button>
      </form>
      <p className="mt-4 text-[10px] leading-relaxed text-muted">
        La contraseña se guarda en este navegador, sin cifrar, para renovar tu
        sesión. Desconectar la elimina.
      </p>
    </section>
  );
}
