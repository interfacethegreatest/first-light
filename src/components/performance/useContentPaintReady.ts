import { useSyncExternalStore } from 'react'

/** One shared, one-shot startup gate; native content paints before GPU work. */
export function createContentPaintGate() {
  const listeners = new Set<() => void>()
  const hasPainted = () => typeof window !== 'undefined'
    && Boolean(window.performance?.getEntriesByName?.('first-contentful-paint').length)
  let ready = hasPainted()
  let stop = () => {}

  function notify() {
    if (ready) return
    ready = true
    stop()
    for (const listener of listeners) listener()
  }

  function observe(): () => void {
    if (hasPainted()) { notify(); return () => {} }
    if (typeof window === 'undefined') return () => {}
    const Observer = window.PerformanceObserver
    let live = true
    if (Observer?.supportedEntryTypes?.includes('paint')) {
      let observer: PerformanceObserver | undefined
      try {
        observer = new Observer(list => {
          if (live && list.getEntries().some(entry => entry.name === 'first-contentful-paint')) notify()
        })
        observer.observe({ type: 'paint', buffered: true })
        return () => { live = false; observer?.disconnect() }
      } catch { observer?.disconnect() }
    }
    // Paint Timing is absent in older Safari. Allow two presentation
    // opportunities plus a task instead of waiting on an unsupported event.
    let first: number | undefined, second: number | undefined, timer: number | undefined
    if (typeof window.requestAnimationFrame === 'function') {
      first = window.requestAnimationFrame(() => {
        if (!live) return
        second = window.requestAnimationFrame(() => {
          if (live) timer = window.setTimeout(() => { if (live) notify() }, 0)
        })
      })
    } else timer = window.setTimeout(() => { if (live) notify() }, 0)
    return () => {
      live = false
      if (first !== undefined) window.cancelAnimationFrame(first)
      if (second !== undefined) window.cancelAnimationFrame(second)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }

  return {
    getSnapshot: () => ready,
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (!ready && listeners.size === 1) { stop = observe(); if (ready) stop() }
      return () => {
        listeners.delete(listener)
        if (!ready && !listeners.size) { stop(); stop = () => {} }
      }
    },
  }
}

const gate = createContentPaintGate()
export function useContentPaintReady() {
  return useSyncExternalStore(gate.subscribe, gate.getSnapshot, () => false)
}
