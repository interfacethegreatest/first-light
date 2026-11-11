import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

// Build-only evidence: transformed dependencies are not necessarily shipped.
// Record rendered modules so duplicate/unused Three.js code can be audited
// without adding instrumentation or source maps to the running application.
const renderingModuleAudit: Plugin = {
  name: 'rendering-module-audit',
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter(output => output.type === 'chunk')
    this.emitFile({
      type: 'asset',
      fileName: '.vite/rendering-modules.json',
      source: JSON.stringify(chunks.map(chunk => ({
        file: chunk.fileName,
        modules: Object.entries(chunk.modules)
          .filter(([, module]) => module.renderedLength > 0)
          .map(([id, module]) => ({
            id: id.replaceAll('\\', '/').replace(`${process.cwd()}/`, ''),
            renderedLength: module.renderedLength,
          })),
      })), null, 2),
    })
  },
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), renderingModuleAudit],
  build: {
    manifest: true,
    // Keep production syntax usable on older iPhones that can run WebGL2.
    // This is a syntax target, not a polyfill or a hardware-performance claim.
    target: ['es2020', 'safari15.4'],
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        glassPanelExample: fileURLToPath(new URL('./examples/glass-panel-3d/index.html', import.meta.url)),
        glassTextExample: fileURLToPath(new URL('./examples/transparent-glass/index.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    // This fixture suite uses Node's test runner, invoked separately by check.
    exclude: [...configDefaults.exclude, 'tests/pack-moon-glb.test.mjs'],
  },
})
