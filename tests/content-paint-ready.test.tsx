import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createContentPaintGate, useContentPaintReady } from '../src/components/performance/useContentPaintReady'

function browser({ cachedFcp = false, observer = true, supported = ['paint'], observeThrows = false, raf = true } = {}) {
  const entries: PerformanceEntry[] = cachedFcp ? [paint('first-contentful-paint')] : []
  const getEntriesByName = vi.spyOn(window.performance, 'getEntriesByName')
    .mockImplementation((name: string) => entries.filter(entry => entry.name === name))
  const observers: Observer[] = []
  class Observer {
    static supportedEntryTypes = supported
    disconnected = false
    constructor(readonly callback: PerformanceObserverCallback) { observers.push(this) }
    observe = vi.fn((_options: PerformanceObserverInit) => {
      if (observeThrows) throw new Error('Paint observation unavailable')
    })
    disconnect = vi.fn(() => { this.disconnected = true })
    emit(values: PerformanceEntry[]) {
      act(() => this.callback({
        getEntries: () => values,
        getEntriesByName: name => values.filter(entry => entry.name === name),
        getEntriesByType: type => values.filter(entry => entry.entryType === type),
      }, this as unknown as PerformanceObserver))
    }
  }
  vi.stubGlobal('PerformanceObserver', observer ? Observer : undefined)
  let nextFrame = 0
  const frames = new Map<number, FrameRequestCallback>()
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextFrame
    frames.set(id, callback)
    return id
  })
  const cancelFrame = vi.fn((id: number) => { frames.delete(id) })
  vi.stubGlobal('requestAnimationFrame', raf ? requestFrame : undefined)
  vi.stubGlobal('cancelAnimationFrame', raf ? cancelFrame : undefined)
  return {
    observers, frames, requestFrame, cancelFrame, getEntriesByName,
    frame() {
      act(() => {
        const pending = [...frames.values()]
        frames.clear()
        pending.forEach(callback => callback(nextFrame * 16))
      })
    },
  }
}

function paint(name: string): PerformanceEntry {
  return { name, entryType: 'paint', startTime: 1, duration: 0, toJSON: () => ({ name }) }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.spyOn(window.performance, 'getEntriesByName').mockReturnValue([])
})
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('shared content-paint loading gate', () => {
  it('recognizes an already recorded FCP without an observer or fallback scheduling', () => {
    const environment = browser({ cachedFcp: true })
    const gate = createContentPaintGate()
    const listener = vi.fn()
    expect(gate.getSnapshot()).toBe(true)
    const unsubscribe = gate.subscribe(listener)
    expect(environment.getEntriesByName).toHaveBeenCalledWith('first-contentful-paint')
    expect(environment.observers).toHaveLength(0)
    expect(environment.requestFrame).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    unsubscribe()
  })

  it('shares one buffered paint observer, ignores other paint entries and stops permanently after FCP', () => {
    const environment = browser()
    const gate = createContentPaintGate()
    const first = vi.fn(), second = vi.fn()
    expect(gate.getSnapshot()).toBe(false)
    const stopFirst = gate.subscribe(first)
    const stopSecond = gate.subscribe(second)
    expect(environment.observers).toHaveLength(1)
    const observer = environment.observers[0]
    expect(observer.observe).toHaveBeenCalledWith({ type: 'paint', buffered: true })
    observer.emit([paint('first-paint')])
    expect(gate.getSnapshot()).toBe(false)
    expect(first).not.toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()
    observer.emit([paint('first-contentful-paint')])
    expect(gate.getSnapshot()).toBe(true)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(observer.disconnect).toHaveBeenCalledTimes(1)
    observer.emit([paint('first-contentful-paint')])
    expect(first).toHaveBeenCalledTimes(1)
    stopFirst(); stopSecond()
    const stopThird = gate.subscribe(vi.fn())
    expect(environment.observers).toHaveLength(1)
    expect(environment.requestFrame).not.toHaveBeenCalled()
    stopThird()
  })

  it('disconnects only after the last subscriber leaves and rearms without accepting stale observer delivery', () => {
    const environment = browser()
    const gate = createContentPaintGate()
    const first = vi.fn(), second = vi.fn(), next = vi.fn()
    const stopFirst = gate.subscribe(first), stopSecond = gate.subscribe(second)
    const previous = environment.observers[0]
    stopFirst()
    expect(previous.disconnect).not.toHaveBeenCalled()
    stopSecond()
    expect(previous.disconnect).toHaveBeenCalledTimes(1)
    const stopNext = gate.subscribe(next)
    expect(environment.observers).toHaveLength(2)
    previous.emit([paint('first-contentful-paint')])
    expect(gate.getSnapshot()).toBe(false)
    expect(next).not.toHaveBeenCalled()
    environment.observers[1].emit([paint('first-contentful-paint')])
    expect(gate.getSnapshot()).toBe(true)
    expect(next).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()
    stopNext()
  })

  it('uses exactly two frames and then a task when paint observation is unsupported', () => {
    const environment = browser({ supported: ['mark'] })
    const gate = createContentPaintGate()
    const listener = vi.fn()
    const stop = gate.subscribe(listener)
    expect(environment.observers).toHaveLength(0)
    environment.frame()
    expect(gate.getSnapshot()).toBe(false)
    expect(listener).not.toHaveBeenCalled()
    environment.frame()
    expect(gate.getSnapshot()).toBe(false)
    expect(environment.frames.size).toBe(0)
    expect(environment.requestFrame).toHaveBeenCalledTimes(2)
    act(() => { vi.runOnlyPendingTimers() })
    expect(gate.getSnapshot()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(environment.requestFrame).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
    stop()
  })

  it('releases an observer whose observe call throws and completes the fallback', () => {
    const environment = browser({ observeThrows: true })
    const gate = createContentPaintGate()
    const listener = vi.fn()
    const stop = gate.subscribe(listener)
    expect(environment.observers).toHaveLength(1)
    expect(environment.observers[0].disconnect).toHaveBeenCalled()
    environment.frame(); environment.frame()
    expect(gate.getSnapshot()).toBe(false)
    act(() => { vi.runOnlyPendingTimers() })
    expect(gate.getSnapshot()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    stop()
  })

  it('cancels fallback frames and the final task when all subscribers leave before readiness', () => {
    const environment = browser({ observer: false })
    const gate = createContentPaintGate()
    const listener = vi.fn()
    const stopFrame = gate.subscribe(listener)
    expect(environment.frames.size).toBe(1)
    stopFrame()
    expect(environment.frames.size).toBe(0)
    expect(environment.cancelFrame).toHaveBeenCalledTimes(1)
    const stopTask = gate.subscribe(listener)
    environment.frame(); environment.frame()
    expect(vi.getTimerCount()).toBe(1)
    stopTask()
    expect(vi.getTimerCount()).toBe(0)
    act(() => { vi.runAllTimers() })
    expect(gate.getSnapshot()).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })

  it('falls back to a cancellable task when requestAnimationFrame is unavailable', () => {
    const environment = browser({ observer: false, raf: false })
    const gate = createContentPaintGate()
    const listener = vi.fn()
    const stop = gate.subscribe(listener)
    expect(environment.requestFrame).not.toHaveBeenCalled()
    expect(gate.getSnapshot()).toBe(false)
    expect(vi.getTimerCount()).toBe(1)
    stop()
    expect(vi.getTimerCount()).toBe(0)
    const stopNext = gate.subscribe(listener)
    act(() => { vi.runOnlyPendingTimers() })
    expect(gate.getSnapshot()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
    stopNext()
  })

  it('keeps the server snapshot false and does not start browser work during SSR', () => {
    const environment = browser({ cachedFcp: true })
    vi.stubGlobal('window', undefined)
    try {
      const gate = createContentPaintGate()
      expect(gate.getSnapshot()).toBe(false)
      const stop = gate.subscribe(vi.fn())
      expect(environment.observers).toHaveLength(0)
      expect(environment.requestFrame).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
      stop()
    } finally { vi.unstubAllGlobals() }
  })

  it('keeps native input usable while React subscribers share the pending gate under StrictMode', () => {
    const environment = browser()
    function View({ name }: { name: string }) {
      const ready = useContentPaintReady()
      return <div><input aria-label={name} />{ready && <span data-testid="optional-graphics">Ready</span>}</div>
    }
    const view = render(<StrictMode><View name="First draft" /><View name="Second draft" /></StrictMode>)
    const input = screen.getByRole('textbox', { name: 'First draft' })
    input.focus()
    fireEvent.change(input, { target: { value: 'Native work before graphics' } })
    expect(screen.queryAllByTestId('optional-graphics')).toHaveLength(0)
    const live = environment.observers.filter(observer => !observer.disconnected)
    expect(live).toHaveLength(1)
    live[0].emit([paint('first-contentful-paint')])
    expect(screen.getAllByTestId('optional-graphics')).toHaveLength(2)
    expect(screen.getByRole('textbox', { name: 'First draft' })).toBe(input)
    expect(input).toHaveValue('Native work before graphics')
    expect(input).toHaveFocus()
    expect(environment.observers.every(observer => observer.disconnected)).toBe(true)
    expect(environment.requestFrame).not.toHaveBeenCalled()
    view.unmount()
    // The shared client store is now ready, but the hook's server snapshot
    // still withholds optional work and retains native content for hydration.
    const server = renderToString(<View name="Server draft" />)
    expect(server).toContain('Server draft')
    expect(server).not.toContain('optional-graphics')
  })
})
