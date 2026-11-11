import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Existing scene tests start at the post-native-paint lifecycle boundary.
// JSDOM has no compositor/Paint Timing. The dedicated content-paint suite
// overrides this fixture to exercise the real shared startup gate itself.
beforeEach(() => {
  if (typeof window.performance.getEntriesByName !== 'function') {
    Object.defineProperty(window.performance, 'getEntriesByName', {
      configurable: true, writable: true, value: () => [],
    })
  }
  const original = window.performance.getEntriesByName.bind(window.performance)
  vi.spyOn(window.performance, 'getEntriesByName').mockImplementation((name, type) =>
    name === 'first-contentful-paint'
      ? [{ name, entryType: 'paint', startTime: 1, duration: 0, toJSON: () => ({}) }]
      : original(name, type),
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
})
