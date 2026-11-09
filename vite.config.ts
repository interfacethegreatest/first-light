import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
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
