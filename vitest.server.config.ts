import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/server/**/*.test.ts'],
    // Real integration suites share one explicitly disposable test database.
    fileParallelism: false,
    restoreMocks: true,
    clearMocks: true,
  },
})
