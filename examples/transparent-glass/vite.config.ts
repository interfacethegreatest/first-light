import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Separate preview build: the existing application build configuration stays intact.
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('../../../artifacts/first-light-transparent-glass-preview/', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) },
  },
})
