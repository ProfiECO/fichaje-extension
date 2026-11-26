import { useEffect, useRef, useState } from 'react';
import * as storage from '../shared/lib/storage.js';
import { login } from '../shared/api/frappe.js';
import { weekStart } from '../shared/lib/time.js';
import { defaults } from '../features/preferences/model.js';
import { loadDashboard } from '../features/tracking/loadDashboard.js';
import { registerCheckin } from '../features/tracking/registerCheckin.js';

export function useExtension() {
  const [config, setConfig] = useState(undefined);
  const [data, setData] = useState(null);
  const [preferences, setPreferences] = useState(defaults);
  const [tab, setTab] = useState('today');
  const [reference, setReference] = useState(() => weekStart(new Date()));
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsSync, setNeedsSync] = useState(false);
  const locked = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [stored, prefs] = await Promise.all([
          storage.getConfig(),
          storage.getPreferences(),
        ]);
        if (!alive) return;
        setPreferences({ ...defaults, ...prefs });
        setConfig(stored || null);
        if (stored) {
          const dashboard = await loadDashboard();
          if (alive) setData(dashboard);
        }
      } catch (err) {
        if (alive) {
          setConfig((value) => value ?? null);
          setError(err.message);
        }
      } finally {
        if (alive) setBusy(false);
      }
    })();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  async function perform(work) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
    } catch (err) {
      setError(err.message || 'Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function sync(date = reference) {
    const dashboard = await loadDashboard(date);
    setData(dashboard);
    setReference(date);
    setNow(new Date());
    setNeedsSync(false);
    return dashboard;
  }
  function connect(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Request host access directly in the submit gesture, before any network I/O.
    perform(async () => {
      const url = new URL(form.get('domain'));
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error('Introduce un dominio HTTP o HTTPS sin credenciales.');
      if (!(await chrome.permissions.request({ origins: [`${url.origin}/*`] })))
        throw new Error(
          'Necesitamos permiso de acceso a tu dominio para conectar.',
        );
      const next = {
        domain: url.origin,
        usr: form.get('usr').trim(),
        pwd: form.get('pwd'),
      };
      if (!next.usr) throw new Error('Introduce tu usuario.');
      await login(next.domain, next.usr, next.pwd);
      await storage.saveConfig(next);
      setConfig(next);
      await sync(weekStart(new Date()));
    });
  }
  function checkin() {
    return perform(() =>
      registerCheckin({ data, sync, setNotice, setNeedsSync }),
    );
  }
  async function savePreferences(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let success = false;
    await perform(async () => {
      const next = {
        dailyHours: Number(form.get('dailyHours')),
        weeklyHours: Number(form.get('weeklyHours')),
      };
      if (!(
        next.dailyHours >= 0.5 &&
        next.dailyHours <= 24 &&
        next.weeklyHours >= 0.5 &&
        next.weeklyHours <= 168
      ))
        throw new Error('Revisa los objetivos de horas.');
      await storage.savePreferences(next);
      setPreferences(next);
      success = true;
    });
    return success;
  }
  function disconnect() {
    return perform(async () => {
      await storage.clearConfig();
      setConfig(null);
      setData(null);
      setTab('today');
      setNeedsSync(false);
    });
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
    disconnect,
  };
}
