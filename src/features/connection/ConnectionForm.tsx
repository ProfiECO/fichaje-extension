import { type SubmitEvent, useState } from 'react'
import type { AccountConfig } from '@/shared/types.ts'
import Icon from '@/shared/ui/Icon.tsx'

interface Props {
  initialValues?: AccountConfig
  busy: boolean
  connect: (event: SubmitEvent<HTMLFormElement>) => void
}
export default function ConnectionForm({
  busy,
  connect,
  initialValues
}: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <section>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Conecta tu cuenta
        </h1>
        <p className='mt-1.5 text-xs leading-relaxed text-muted'>
          Tu jornada de Frappe HR, a un clic.
        </p>
      </div>
      <form onSubmit={connect} className='space-y-4'>
        <label>
          Dominio de Frappe HR
          <input
            name='domain'
            defaultValue={initialValues?.domain}
            type='url'
            placeholder='https://fichaje.tuempresa.com'
            autoComplete='url'
            spellCheck={false}
            required
            disabled={busy}
          />
        </label>
        <label>
          Usuario
          <input
            name='usr'
            defaultValue={initialValues?.usr}
            autoComplete='username'
            autoCapitalize='none'
            spellCheck={false}
            placeholder='tu@empresa.com'
            required
            disabled={busy}
          />
        </label>
        <label>
          Contraseña
          <span className='relative block'>
            <input
              className='pe-11'
              name='pwd'
              defaultValue={initialValues?.pwd}
              type={visible ? 'text' : 'password'}
              autoComplete='current-password'
              required
              disabled={busy}
            />
            <button
              type='button'
              className='absolute inset-y-0 end-1 my-auto grid size-9 place-items-center rounded-lg text-muted hover:text-ink'
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              <Icon name={visible ? 'eyeOff' : 'eye'} size={17} />
            </button>
          </span>
        </label>
        <button type='submit' className='btn-primary' disabled={busy}>
          {busy ? 'Conectando…' : 'Conectar cuenta'}
          <Icon name='arrow' size={17} />
        </button>
      </form>
      <p className='mt-4 text-[10px] leading-relaxed text-muted'>
        La contraseña se guarda en este navegador, sin cifrar. Puedes borrarla
        al desconectar.
      </p>
    </section>
  )
}
