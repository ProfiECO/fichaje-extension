import { readFileSync, writeFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { createManifest } from './extension/manifest.ts'

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'extension-manifest',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(createManifest(version), null, 2)
        })
      },
      writeBundle() {
        // Preserve the original unpacked extension path and its stored account.
        writeFileSync(
          new URL('./manifest.json', import.meta.url),
          `${JSON.stringify(createManifest(version, 'dist/popup.html'), null, 2)}\n`
        )
      }
    }
  ],
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: { tsconfigPaths: true },
  base: './',
  publicDir: false,
  input: 'popup.html',
  test: { include: ['tests/**/*.test.{js,ts,tsx}'], environment: 'node' }
})
