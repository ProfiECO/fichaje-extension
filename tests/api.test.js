import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCheckins,
  getWeekCheckins,
  createCheckin,
} from '../src/features/tracking/api.js';
import {
  getConfig,
  clearConfig,
  getPreferences,
} from '../src/shared/lib/storage.js';
import { registerCheckin } from '../src/features/tracking/registerCheckin.js';

const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
let saved;
beforeEach(() => {
  saved = {
    config: {
      domain: 'https://hr.example.com',
      usr: 'employee',
      pwd: 'test-only',
    },
  };
  globalThis.chrome = {
    storage: {
      local: {
        get: async (key) => ({ [key]: saved[key] }),
        set: async (values) => Object.assign(saved, values),
        remove: async (key) => {
          delete saved[key];
        },
      },
    },
  };
});
afterEach(() => {
  mock.restoreAll();
  delete globalThis.chrome;
});

test('preserves legacy configuration and disconnect only removes credentials', async () => {
  saved.preferences = { dailyHours: 7, weeklyHours: 35 };
  assert.equal((await getConfig()).usr, 'employee');
  await clearConfig();
  assert.equal(await getConfig(), undefined);
  assert.equal((await getPreferences()).weeklyHours, 35);
});

test('paginates checkins instead of relying on unlimited server responses', async () => {
  const starts = [];
  mock.method(globalThis, 'fetch', async (url) => {
    const query = new URL(url).searchParams;
    starts.push(Number(query.get('limit_start')));
    assert.equal(query.get('limit_page_length'), '500');
    return response({
      data:
        starts.length === 1
          ? Array.from({ length: 500 }, (_, i) => ({ name: `${i}` }))
          : [{ name: 'last' }],
    });
  });
  assert.equal((await getCheckins('EMP-001', [])).length, 501);
  assert.deepEqual(starts, [0, 500]);
});

test('loads the predecessor even if the open shift started long before Monday', async () => {
  mock.method(globalThis, 'fetch', async (url) => {
    const filters = JSON.parse(new URL(url).searchParams.get('filters'));
    assert.deepEqual(filters[0], ['employee', '=', 'EMP-001']);
    return response({
      data: filters.some((f) => f[1] === '>=')
        ? [{ name: 'out', log_type: 'OUT', time: '2026-11-02 02:00:00' }]
        : [{ name: 'in', log_type: 'IN', time: '2026-10-30 22:00:00' }],
    });
  });
  const logs = await getWeekCheckins('EMP-001', new Date(2026, 10, 4));
  assert.deepEqual(
    logs.map((log) => log.name),
    ['in', 'out'],
  );
});

test('parallel unauthorized requests share session renewal', async () => {
  let loggedIn = false;
  let logins = 0;
  mock.method(globalThis, 'fetch', async (url) => {
    if (url.endsWith('/login')) {
      logins++;
      await new Promise((resolve) => setImmediate(resolve));
      loggedIn = true;
      return response({ message: 'Logged In' });
    }
    return loggedIn ? response({ data: [] }) : response({}, 401);
  });
  await Promise.all([getCheckins('EMP-001', []), getCheckins('EMP-001', [])]);
  assert.equal(logins, 1);
});

test('a network failure during a checkin is never automatically retried', async () => {
  let posts = 0;
  mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.endsWith('/hrms'))
      return new Response('frappe.csrf_token = "token";');
    assert.equal(options.headers['X-Frappe-CSRF-Token'], 'token');
    posts++;
    throw new TypeError('Connection lost');
  });
  await assert.rejects(
    createCheckin({ employee: 'EMP-001', log_type: 'IN' }),
    /No se pudo conectar/,
  );
  assert.equal(posts, 1);
});

test('does not send a checkin when another device changed the latest record', async () => {
  let notice = '';
  const fetch = mock.method(globalThis, 'fetch', async () => {
    throw new Error('Unexpected network request');
  });
  await registerCheckin({
    data: { last: { name: 'old' } },
    sync: async () => ({ last: { name: 'new' } }),
    setNotice: (value) => {
      notice = value;
    },
    setNeedsSync: () => {},
  });
  assert.match(notice, /han cambiado/);
  assert.equal(fetch.mock.callCount(), 0);
});

test('keeps checkin locked after an uncertain result', async () => {
  let locked = false;
  mock.method(globalThis, 'fetch', async (url) => {
    if (url.endsWith('/hrms')) return new Response('csrf_token = "token"');
    throw new TypeError('Network lost');
  });
  const dashboard = { last: null, employee: { name: 'EMP-001' }, settings: {} };
  await assert.rejects(
    registerCheckin({
      data: dashboard,
      sync: async () => dashboard,
      setNotice: () => {},
      setNeedsSync: (value) => {
        locked = value;
      },
    }),
    /Actualiza antes de volver a fichar/,
  );
  assert.equal(locked, true);
});

test('reports a saved checkin separately from a subsequent refresh failure', async () => {
  let calls = 0;
  const dashboard = { last: null, employee: { name: 'EMP-001' }, settings: {} };
  mock.method(globalThis, 'fetch', async (url) =>
    url.endsWith('/hrms')
      ? new Response('csrf_token = "token"')
      : response({ data: { name: 'new' } }),
  );
  await assert.rejects(
    registerCheckin({
      data: dashboard,
      sync: async () => {
        if (calls++) throw new Error('Offline');
        return dashboard;
      },
      setNotice: () => {},
      setNeedsSync: () => {},
    }),
    /El fichaje se ha guardado/,
  );
});

test('required geolocation failure prevents sending a checkin', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { geolocation: { getCurrentPosition: (_, reject) => reject() } },
  });
  const fetch = mock.method(globalThis, 'fetch', async () => {
    throw new Error('Unexpected request');
  });
  const dashboard = {
    last: null,
    employee: { name: 'EMP-001' },
    settings: { allow_geolocation_tracking: 1 },
  };
  try {
    await assert.rejects(
      registerCheckin({
        data: dashboard,
        sync: async () => dashboard,
        setNotice: () => {},
        setNeedsSync: () => {},
      }),
      /ubicación obligatoria/,
    );
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  }
});
