import { before, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';
import { toServer } from '../src/shared/lib/time.js';

let bundle;
let dom;
before(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      react(),
      {
        name: 'omit-test-styles',
        transform: (_, id) => (id.endsWith('.css') ? '' : undefined),
      },
    ],
    define: {
      __APP_VERSION__: '"test"',
      'process.env.NODE_ENV': '"production"',
    },
    build: {
      write: false,
      lib: {
        entry: resolve('src/main.jsx'),
        name: 'FichajeTest',
        formats: ['iife'],
      },
    },
  });
  bundle = (Array.isArray(result) ? result[0] : result).output.find(
    (asset) => asset.type === 'chunk',
  ).code;
});
afterEach(() => dom?.window.close());

async function waitFor(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error('UI did not reach the expected state');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
function mount(initial = {}, { onLogin, loginStatus = 200 } = {}) {
  const saved = structuredClone(initial);
  dom = new JSDOM('<div id="root"></div>', {
    runScripts: 'outside-only',
    url: 'https://extension.test',
  });
  dom.window.AbortSignal = globalThis.AbortSignal;
  dom.window.chrome = {
    permissions: { request: async () => true },
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
  const start = new Date();
  start.setHours(8, 0, 0, 0);
  const end = new Date();
  end.setHours(9, 0, 0, 0);
  const logs = [
    { name: 'in-1', log_type: 'IN', time: toServer(start) },
    { name: 'out-1', log_type: 'OUT', time: toServer(end) },
  ];
  dom.window.fetch = async (url, options) => {
    if (url.endsWith('/api/method/login')) {
      onLogin?.(url, new URLSearchParams(options.body.toString()));
      return new Response(
        JSON.stringify({
          message:
            loginStatus === 200 ? 'Logged In' : 'Invalid login credentials',
        }),
        { status: loginStatus },
      );
    }
    let data;
    if (url.includes('get_current_employee_info'))
      data = { message: { name: 'EMP-001', employee_name: 'Ana García' } };
    else if (url.includes('get_hr_settings'))
      data = { message: { allow_geolocation_tracking: 0 } };
    else {
      const params = new URL(url).searchParams;
      const filters = JSON.parse(params.get('filters'));
      const matches = logs.filter((log) =>
        filters.every(
          ([key, operator, value]) =>
            key !== 'time' ||
            (operator === '<' ? log.time < value : log.time >= value),
        ),
      );
      data = {
        data:
          params.get('limit_page_length') === '1' ? matches.slice(-1) : matches,
      };
    }
    return new Response(JSON.stringify(data));
  };
  dom.window.eval(bundle);
  return saved;
}
const text = () => dom.window.document.body.textContent;
const button = (name) =>
  [...dom.window.document.querySelectorAll('button')].find(
    (element) => element.textContent.trim() === name,
  );

test('renders the connection form when no configuration exists', async () => {
  mount();
  await waitFor(() => button('Conectar cuenta'));
  assert.ok(dom.window.document.querySelector('input[type="password"]'));
  assert.match(text(), /sin cifrar/);
  assert.equal(dom.window.document.querySelector('nav'), null);
});

test('loads an existing account, navigates features, saves goals and disconnects', async () => {
  const saved = mount({
    config: { domain: 'https://hr.example.com', usr: 'ana', pwd: 'test-only' },
  });
  await waitFor(
    () => text().includes('Ana García') && !text().includes('Sincronizando'),
  );
  assert.ok(button('Registrar entrada'));
  assert.ok(!text().includes('test-only'));
  button('Semana').click();
  await waitFor(() => button('Exportar resumen CSV'));
  assert.ok(
    dom.window.document.querySelector('[aria-label="Objetivo semanal"]'),
  );
  button('Historial').click();
  await waitFor(() => text().includes('2 fichajes'));
  button('Ajustes').click();
  await waitFor(() =>
    dom.window.document.querySelector('input[name="dailyHours"]'),
  );
  dom.window.document.querySelector('input[name="dailyHours"]').value = '7.5';
  dom.window.document.querySelector('input[name="weeklyHours"]').value = '37.5';
  button('Guardar objetivos').click();
  await waitFor(() => text().includes('Objetivos guardados'));
  assert.equal(saved.preferences.dailyHours, 7.5);
  assert.equal(saved.preferences.weeklyHours, 37.5);
  button('Desconectar cuenta').click();
  await waitFor(() => button('Conectar cuenta'));
  assert.equal(saved.config, undefined);
  assert.equal(saved.preferences.dailyHours, 7.5);
});

test('submits the exact entered credentials, including special password characters', async () => {
  let submitted;
  const saved = mount(
    {},
    {
      onLogin: (url, fields) => {
        submitted = { url, fields };
      },
    },
  );
  await waitFor(
    () => button('Conectar cuenta') && !button('Conectar cuenta').disabled,
  );
  dom.window.document.querySelector('input[name="domain"]').value =
    'https://hr.example.com';
  dom.window.document.querySelector('input[name="usr"]').value =
    ' ana@example.com ';
  dom.window.document.querySelector('input[name="pwd"]').value = 'a+B&= ñ 123';
  button('Conectar cuenta').click();
  await waitFor(() => text().includes('Ana García'));
  assert.equal(submitted.url, 'https://hr.example.com/api/method/login');
  assert.equal(submitted.fields.get('usr'), 'ana@example.com');
  assert.equal(submitted.fields.get('pwd'), 'a+B&= ñ 123');
  assert.equal(saved.config.pwd, 'a+B&= ñ 123');
});

test('shows a server login rejection without saving credentials or clearing the form', async () => {
  const saved = mount({}, { loginStatus: 401 });
  await waitFor(
    () => button('Conectar cuenta') && !button('Conectar cuenta').disabled,
  );
  dom.window.document.querySelector('input[name="domain"]').value =
    'https://hr.example.com';
  dom.window.document.querySelector('input[name="usr"]').value =
    'ana@example.com';
  dom.window.document.querySelector('input[name="pwd"]').value = 'test-only';
  button('Conectar cuenta').click();
  await waitFor(() => text().includes('Invalid login credentials'));
  assert.equal(saved.config, undefined);
  assert.equal(
    dom.window.document.querySelector('input[name="usr"]').value,
    'ana@example.com',
  );
});
