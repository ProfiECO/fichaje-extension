import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { createManifest } from '../extension/manifest.js';
import { verifyBuild } from './verify-build.js';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
// Keep the original unpacked extension path and ID working after a reload.
await writeFile(
  'manifest.json',
  JSON.stringify(createManifest(version, 'dist/popup.html'), null, 2) + '\n',
);
await build({ build: { watch: process.argv.includes('--watch') ? {} : null } });
if (!process.argv.includes('--watch')) await verifyBuild();
console.log(
  'Extensión lista en dist/. La instalación desde la raíz también es compatible.',
);
