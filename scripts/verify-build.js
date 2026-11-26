import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export async function verifyBuild() {
  const { version } = JSON.parse(await readFile('package.json', 'utf8'));
  for (const path of ['manifest.json', 'dist/manifest.json']) {
    const manifest = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(manifest.version, version);
    const popup = resolve(dirname(path), manifest.action.default_popup);
    await access(popup);
    const html = await readFile(popup, 'utf8');
    const resources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.ok(
      resources.some((resource) => resource.endsWith('.js')),
      'Missing bundled JavaScript',
    );
    assert.ok(
      resources.some((resource) => resource.endsWith('.css')),
      'Missing bundled CSS',
    );
    for (const resource of resources) {
      assert.ok(
        !/^(https?:|\/)/.test(resource),
        'Extension assets must be local and relative',
      );
      await access(resolve(dirname(popup), resource));
    }
    assert.ok(
      !/<script[^>]*>\s*[^<\s]/.test(html),
      'Inline scripts are not allowed',
    );
  }
  console.log(
    'Manifiestos, versiones y recursos de ambas instalaciones verificados.',
  );
}
