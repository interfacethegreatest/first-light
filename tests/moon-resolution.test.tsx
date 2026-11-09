import { StrictMode, type Ref } from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Canvas } from '@react-three/fiber'
import MoonMarkCanvas from '../src/components/misc/MoonMark/MoonMarkCanvas'
import { useMoonResolution } from '../src/components/misc/MoonMark/useMoonResolution'

vi.mock('@react-three/fiber', () => ({ Canvas: vi.fn() }))
vi.mock('../src/components/misc/MoonMark/MoonModel', () => ({ default: () => null }))

function environment({ dpr = 1, scale = 1, viewport = true, matchMedia = true }: {
  dpr?: unknown
  scale?: unknown
  viewport?: boolean
  matchMedia?: boolean
} = {}) {
  vi.stubGlobal('devicePixelRatio', dpr)
  const visual = new EventTarget() as EventTarget & { scale: unknown }
  visual.scale = scale
  vi.stubGlobal('visualViewport', viewport ? visual : undefined)
  const queries: { query: string; listeners: Set<() => void> }[] = []
  vi.stubGlobal('matchMedia', matchMedia ? vi.fn((query: string) => {
    const listeners = new Set<() => void>()
    queries.push({ query, listeners })
    return {
      matches: true,
      addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    }
  }) : undefined)
  return {
    visual,
    queries,
    resize(nextDpr: unknown) {
      act(() => {
        vi.stubGlobal('devicePixelRatio', nextDpr)
        window.dispatchEvent(new Event('resize'))
      })
    },
    pinch(nextScale: unknown) {
      act(() => {
        visual.scale = nextScale
        visual.dispatchEvent(new Event('resize'))
      })
    },
    changeDisplay(nextDpr: unknown) {
      const previous = queries.at(-1)!
      act(() => {
        vi.stubGlobal('devicePixelRatio', nextDpr)
        for (const listener of [...previous.listeners]) listener()
      })
    },
  }
}

beforeEach(() => {
  vi.mocked(Canvas).mockImplementation(props => (
    <canvas ref={(props as { ref?: Ref<HTMLCanvasElement> }).ref} />
  ))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Moon render-buffer resolution', () => {
  it('uses normal display DPR and supplies a number without changing demand rendering', () => {
    environment({ dpr: 2 })
    render(<MoonMarkCanvas />)
    const props = vi.mocked(Canvas).mock.calls.at(-1)![0]
    expect(props.dpr).toBe(2)
    expect(props.frameloop).toBe('demand')
    expect(props.orthographic).toBe(true)
    expect(props.gl).toEqual({ alpha: true, antialias: true })
  })

  it('tracks desktop zoom through DPR without counting an extra window-size ratio', () => {
    vi.stubGlobal('outerWidth', 1440)
    vi.stubGlobal('innerWidth', 720)
    const browser = environment({ dpr: 1.25 })
    const { result } = renderHook(useMoonResolution)
    expect(result.current).toBe(1.25)
    browser.resize(2)
    expect(result.current).toBe(2)
    browser.resize(3)
    expect(result.current).toBe(3)
    browser.resize(8)
    expect(result.current).toBe(4)
  })

  it('accounts for mobile pinch scale, caps it, and returns to the base DPR', () => {
    const browser = environment({ dpr: 2 })
    const { result } = renderHook(useMoonResolution)
    browser.pinch(1.5)
    expect(result.current).toBe(3)
    browser.pinch(5)
    expect(result.current).toBe(4)
    browser.pinch(1)
    expect(result.current).toBe(2)
  })

  it('handles display DPR changes without resize and releases the old query', () => {
    const browser = environment({ dpr: 2 })
    const { result } = renderHook(useMoonResolution)
    expect(browser.queries.at(-1)!.query).toBe('(resolution: 2dppx)')
    browser.changeDisplay(3)
    expect(result.current).toBe(3)
    expect(browser.queries[0].listeners.size).toBe(0)
    expect(browser.queries.at(-1)!.query).toBe('(resolution: 3dppx)')
  })

  for (const [name, dpr, scale, expected] of [
    ['missing display DPR', undefined, 1, 1],
    ['NaN display DPR', NaN, 1, 1],
    ['infinite display DPR', Infinity, 1, 1],
    ['negative display DPR', -2, 1, 1],
    ['non-numeric display DPR', '3', 1, 1],
    ['invalid pinch scale', 2, NaN, 2],
    ['infinite pinch scale', 2, Infinity, 2],
    ['zero pinch scale', 2, 0, 2],
    ['fractional zoom-out floor', 0.5, 0.5, 1],
    ['large finite zoom values', Number.MAX_VALUE, Number.MAX_VALUE, 4],
  ] as const) {
    it(`safely bounds ${name}`, () => {
      environment({ dpr, scale })
      const { result } = renderHook(useMoonResolution)
      expect(result.current).toBe(expected)
    })
  }

  it('works without visualViewport or matchMedia and still tracks resize', () => {
    const browser = environment({ dpr: 2, viewport: false, matchMedia: false })
    const { result } = renderHook(useMoonResolution)
    expect(result.current).toBe(2)
    browser.resize(3)
    expect(result.current).toBe(3)
  })

  it('cleans up window, visual viewport and resolution listeners under StrictMode', () => {
    const browser = environment({ dpr: 2 })
    const windowRemoved = vi.spyOn(window, 'removeEventListener')
    const viewportRemoved = vi.spyOn(browser.visual, 'removeEventListener')
    const { unmount } = renderHook(useMoonResolution, { wrapper: StrictMode })
    expect(browser.queries.reduce((sum, query) => sum + query.listeners.size, 0)).toBe(1)
    unmount()
    expect(windowRemoved).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(viewportRemoved).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(browser.queries.every(query => query.listeners.size === 0)).toBe(true)
  })

  it('does not poll, schedule animation frames, or rerender for unchanged resize events', () => {
    const browser = environment({ dpr: 2 })
    const frames = vi.fn(), intervals = vi.fn()
    vi.stubGlobal('requestAnimationFrame', frames)
    vi.stubGlobal('setInterval', intervals)
    let renders = 0
    renderHook(() => { renders++; return useMoonResolution() })
    browser.resize(2)
    browser.pinch(1)
    expect(renders).toBe(1)
    expect(browser.queries).toHaveLength(1)
    expect(frames).not.toHaveBeenCalled()
    expect(intervals).not.toHaveBeenCalled()
  })
})
