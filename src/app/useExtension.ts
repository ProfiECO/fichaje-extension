import type { SubmitEvent } from 'react'
import { errorMessage } from '@/shared/lib/errors.ts'
import type { AccountConfig, Dashboard } from '@/shared/types.ts'
export type Section = 'today' | 'week' | 'history' | 'settings'

import { useEffect, useRef, useState } from 'react'
import { defaults } from '@/features/preferences/model.ts'
import { loadDashboard } from '@/features/tracking/loadDashboard.ts'
import { registerCheckin } from '@/features/tracking/registerCheckin.ts'
import { login } from '@/shared/api/frappe.ts'
import * as storage from '@/shared/lib/storage.ts'
import { weekStart } from '@/shared/lib/time.ts'

export function useExtension() {
  const [config, setConfig] = useState<AccountConfig | null | undefined>(
    undefined
  )
  const [data, setData] = useState<Dashboard | null>(null)
  const [preferences, setPreferences] = useState(defaults)
  const [tab, setTab] = useState<Section>('today')
  const [reference, setReference] = useState(() => weekStart(new Date()))
  const [now, setNow] = useState(() => new Date())
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [needsSync, setNeedsSync] = useState(false)
  const locked = useRef(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [stored, prefs] = await Promise.all([
          storage.getConfig(),
          storage.getPreferences()
        ])
        if (!alive) return
        setPreferences({ ...defaults, ...prefs })
        setConfig(stored || null)
        if (stored) {
          const dashboard = await loadDashboard()
          if (alive) setData(dashboard)
        }
      } catch (err) {
        if (alive) {
          setConfig((value) => value ?? null)
          setError(errorMessage(err))
        }
      } finally {
        if (alive) setBusy(false)
      }
    })()
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  async function perform(work: () => Promise<unknown>) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await work()
    } catch (err) {
      setError(errorMessage(err) || 'Ha ocurrido un error. Inténtalo de nuevo.')
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  async function sync(date = reference) {
    const dashboard = await loadDashboard(date)
    setData(dashboard)
    setReference(date)
    setNow(new Date())
    setNeedsSync(false)
    return dashboard
  }
  function connect(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // Request host access directly in the submit gesture, before any network I/O.
    perform(async () => {
      const url = new URL(String(form.get('domain')))
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error('Introduce un dominio HTTP o HTTPS sin credenciales.')
      if (!(await chrome.permissions.request({ origins: [`${url.origin}/*`] })))
        throw new Error(
          'Necesitamos permiso de acceso a tu dominio para conectar.'
        )
      const next = {
        domain: url.origin,
        usr: String(form.get('usr') ?? '').trim(),
        pwd: String(form.get('pwd') ?? '')
      }
      if (!next.usr) throw new Error('Introduce tu usuario.')
      await login(next.domain, next.usr, next.pwd)
      await storage.saveConfig(next)
      setConfig(next)
      await sync(weekStart(new Date()))
    })
  }
  function checkin() {
    const dashboard = data
    if (!dashboard) return
    return perform(() =>
      registerCheckin({ data: dashboard, sync, setNotice, setNeedsSync })
    )
  }
  async function savePreferences(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    let success = false
    await perform(async () => {
      const next = {
        dailyHours: Number(form.get('dailyHours')),
        weeklyHours: Number(form.get('weeklyHours'))
      }
      if (
        !(
          next.dailyHours >= 0.5 &&
          next.dailyHours <= 24 &&
          next.weeklyHours >= 0.5 &&
          next.weeklyHours <= 168
        )
      )
        throw new Error('Revisa los objetivos de horas.')
      await storage.savePreferences(next)
      setPreferences(next)
      success = true
    })
    return success
  }
  function disconnect() {
    return perform(async () => {
      await storage.clearConfig()
      setConfig(null)
      setData(null)
      setTab('today')
      setNeedsSync(false)
    })
  }
  return {
    config,
    data,
    preferences,
    tab,
    setTab,
    reference,
    now,
    busy,
    error,
    notice,
    needsSync,
    perform,
    sync,
    connect,
    checkin,
    savePreferences,
    disconnect
  }
}
