import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createManifest } from './extension/manifest.js';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'extension-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(createManifest(version), null, 2),
        });
      },
    },
  ],
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: './',
  publicDir: false,
  build: { rollupOptions: { input: 'popup.html' } },
});
