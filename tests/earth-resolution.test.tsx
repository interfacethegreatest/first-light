import { StrictMode, type Ref } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Canvas } from '@react-three/fiber'
import EarthMarkCanvas from '../src/components/misc/EarthMark/EarthMarkCanvas'

// Exercise the real Earth Canvas and shared resolution hook. Only the GPU
// boundary/model are replaced; DOM identity and browser events remain real.
vi.mock('@react-three/fiber', () => ({ Canvas: vi.fn() }))
vi.mock('../src/components/misc/EarthMark/EarthModel', () => ({ default: () => null }))

function environment(dpr = 2) {
  vi.stubGlobal('devicePixelRatio', dpr)
  const visual = Object.assign(new EventTarget(), { scale: 1 })
  vi.stubGlobal('visualViewport', visual)
  const queries: Array<{ query: string; listeners: Set<() => void> }> = []
  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    const listeners = new Set<() => void>()
    queries.push({ query, listeners })
    return {
      matches: true,
      addEventListener: (_name: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_name: string, listener: () => void) => listeners.delete(listener),
    }
  }))
  return {
    visual, queries,
    desktopDpr(value: number) {
      act(() => { vi.stubGlobal('devicePixelRatio', value);window.dispatchEvent(new Event('resize')) })
    },
    pinch(value: number) {
      act(() => { visual.scale = value;visual.dispatchEvent(new Event('resize')) })
    },
  }
}
function currentCanvasProps() { return vi.mocked(Canvas).mock.calls.at(-1)![0] }

beforeEach(() => {
  vi.mocked(Canvas).mockImplementation(props => (
    <canvas ref={(props as { ref?: Ref<HTMLCanvasElement> }).ref}
      data-testid="earth-render-boundary" data-dpr={Number(props.dpr)}
      data-frameloop={props.frameloop} style={props.style} />
  ))
})
afterEach(() => { cleanup();vi.unstubAllGlobals() })

describe('Earth integration with the shared Moon renderer resolution policy', () => {
  it('tracks desktop DPR through the same stationary canvas without applying a second window-width ratio', () => {
    vi.stubGlobal('outerWidth', 1440);vi.stubGlobal('innerWidth', 720)
    const browser = environment()
    const view = render(<EarthMarkCanvas />)
    const canvas = screen.getByTestId('earth-render-boundary')
    expect(canvas).toHaveAttribute('data-dpr', '2')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(canvas.style.width).toBe('100%');expect(canvas.style.height).toBe('100%')
    const { camera, gl } = currentCanvasProps()

    browser.desktopDpr(3)

    expect(screen.getByTestId('earth-render-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-dpr', '2')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(currentCanvasProps().camera).toBe(camera)
    expect(currentCanvasProps().gl).toBe(gl)
    expect(canvas.style.width).toBe('100%');expect(canvas.style.height).toBe('100%')
    expect(browser.queries.at(-1)!.query).toBe('(resolution: 3dppx)')
    view.unmount()
    expect(browser.queries.every(query => query.listeners.size === 0)).toBe(true)
  })

  it('follows mobile pinch resolution and back while keeping rotation, native canvas, dimensions and listener cleanup intact', () => {
    const browser = environment(1)
    const windowRemoved = vi.spyOn(window, 'removeEventListener')
    const viewportRemoved = vi.spyOn(browser.visual, 'removeEventListener')
    const view = render(<StrictMode><EarthMarkCanvas animate rotationAxis="y" rotationSpeed={-0.12} /></StrictMode>)
    const canvas = screen.getByTestId('earth-render-boundary')
    expect(canvas).toHaveAttribute('data-dpr', '1')
    expect(canvas).toHaveAttribute('data-frameloop', 'always')

    browser.pinch(2)
    expect(canvas).toHaveAttribute('data-dpr', '2')
    browser.pinch(8)
    expect(canvas).toHaveAttribute('data-dpr', '2')
    browser.pinch(1)
    expect(canvas).toHaveAttribute('data-dpr', '1')
    expect(screen.getByTestId('earth-render-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(canvas.style.width).toBe('100%');expect(canvas.style.height).toBe('100%')

    view.unmount()
    expect(windowRemoved).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(viewportRemoved).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(browser.queries.every(query => query.listeners.size === 0)).toBe(true)
    const calls = vi.mocked(Canvas).mock.calls.length
    browser.pinch(2);browser.desktopDpr(3)
    expect(Canvas).toHaveBeenCalledTimes(calls)
  })
})
