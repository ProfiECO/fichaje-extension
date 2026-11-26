import type { SubmitEvent } from 'react'
import type { AccountConfig, Preferences } from '@/shared/types.ts'
import Icon from '@/shared/ui/Icon.tsx'

interface Props {
  preferences: Preferences
  busy: boolean
  save: (event: SubmitEvent<HTMLFormElement>) => Promise<boolean>
  disconnect: () => void
  config: AccountConfig
}

import { useState } from 'react'

export default function PreferencesPanel({
  preferences,
  busy,
  save,
  disconnect,
  config
}: Props) {
  const [saved, setSaved] = useState(false)
  return (
    <section>
      <h2 className='text-lg font-semibold tracking-tight'>Ajustes</h2>
      <p className='mt-2 mb-5 text-[11px] text-muted'>
        Configura tus objetivos personales.
      </p>
      <form
        onSubmit={async (event) => {
          setSaved(false)
          if (await save(event)) setSaved(true)
        }}
        onChange={() => setSaved(false)}
      >
        <div className='mb-4 grid grid-cols-2 gap-3'>
          <label>
            Horas al día
            <input
              name='dailyHours'
              type='number'
              min='0.5'
              max='24'
              step='0.5'
              required
              defaultValue={preferences.dailyHours}
            />
          </label>
          <label>
            Horas por semana
            <input
              name='weeklyHours'
              type='number'
              min='0.5'
              max='168'
              step='0.5'
              required
              defaultValue={preferences.weeklyHours}
            />
          </label>
        </div>
        <button type='submit' className='btn-primary' disabled={busy}>
          Guardar objetivos
        </button>
        {saved && (
          <p
            className='mt-2 rounded-lg bg-soft p-2 text-[11px] text-accent'
            role='status'
          >
            Objetivos guardados.
          </p>
        )}
      </form>
      <div className='mt-6 border-t border-line pt-5'>
        <strong className='text-xs font-semibold'>Tu cuenta</strong>
        <a
          className='mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted hover:text-accent'
          href={`${config.domain}/hrms`}
          target='_blank'
          rel='noreferrer'
        >
          <span className='truncate'>{new URL(config.domain).host}</span>
          <Icon name='external' size={12} />
        </a>
        <p className='mt-1.5 mb-3 text-[11px] text-muted'>
          Desconectar borra las credenciales de la extensión.
        </p>
        <button
          type='button'
          className='rounded-lg border border-line px-3 py-2 text-[11px] text-danger'
          onClick={disconnect}
          disabled={busy}
        >
          Desconectar cuenta
        </button>
      </div>
    </section>
  )
}
