import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SunMark from '../src/components/misc/SunMark/SunMark'
import SunMarkCanvas from '../src/components/misc/SunMark/SunMarkCanvas'
import NewUserCard from '../src/components/cards/newUserCard/NewUserCard'

const paint = vi.hoisted(() => ({ ready: true, listeners: new Set<() => void>() }))
vi.mock('../src/components/performance/useContentPaintReady', async () => {
  const { useSyncExternalStore } = await import('react')
  return { useContentPaintReady: () => useSyncExternalStore(listener => {
    paint.listeners.add(listener)
    return () => { paint.listeners.delete(listener) }
  }, () => paint.ready) }
})
vi.mock('../src/components/misc/SunMark/SunMarkCanvas', () => ({ default: vi.fn() }))

function environment({ reduced = false, coarse = false, webgl = true, hidden = false, observe = true } = {}) {
  function query(matches: boolean) {
    const listeners = new Set<() => void>()
    const media = {
      matches,
      addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)),
      addListener: vi.fn(), removeListener: vi.fn(),
    }
    return { media, listeners }
  }
  const motion = query(reduced), pointer = query(coarse)
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('reduced-motion') ? motion.media : pointer.media))
  vi.stubGlobal('WebGLRenderingContext', webgl ? class {} : undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  let visibility = hidden ? 'hidden' : 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility as DocumentVisibilityState)
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    disconnected = false
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    observe = vi.fn((target: Element) => { this.target = target })
    disconnect = vi.fn(() => { this.disconnected = true })
    emit(intersecting: boolean) {
      this.callback([{ target: this.target!, isIntersecting: intersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
  }
  vi.stubGlobal('IntersectionObserver', observe ? Observer : undefined)
  return {
    observers, motion, pointer,
    intersect(target: Element, intersecting: boolean) {
      act(() => observers.filter(observer => observer.target === target && !observer.disconnected).forEach(observer => observer.emit(intersecting)))
    },
    visibility(hidden: boolean) {
      act(() => { visibility = hidden ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')) })
    },
    reduced(matches: boolean) {
      act(() => { motion.media.matches = matches; motion.listeners.forEach(listener => listener()) })
    },
  }
}
function mark(container: HTMLElement) { return container.querySelector('[data-sun-mark]')! }
function latestRenderer() { return vi.mocked(SunMarkCanvas).mock.calls.at(-1)![0] }

beforeEach(() => {
  paint.ready = true
  vi.mocked(SunMarkCanvas).mockImplementation(({ animate, interactive }) => <div data-testid="sun-gpu-boundary" data-animate={Boolean(animate)} data-interactive={Boolean(interactive)} />)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('reusable Sun mark', () => {
  it('keeps the reserved badge free of icons until the genuine model renders', async () => {
    paint.ready = false
    const activity = environment()
    const view = render(<StrictMode><SunMark className="reusable-sun" size={36} /></StrictMode>)
    const element = mark(view.container)
    expect(element).toHaveAttribute('aria-hidden', 'true')
    expect(element).toHaveClass('reusable-sun')
    expect(element).toHaveAttribute('data-sun-state', 'pending')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
    activity.intersect(element, true)
    expect(SunMarkCanvas).not.toHaveBeenCalled()
    act(() => { paint.ready = true; paint.listeners.forEach(listener => listener()) })
    await screen.findByTestId('sun-gpu-boundary')
    expect(element).toHaveAttribute('data-sun-state', 'loading')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
    expect(latestRenderer().animate).toBe(false)
    act(() => latestRenderer().onReady?.())
    expect(element).toHaveAttribute('data-sun-state', 'loaded')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
    expect(latestRenderer().animate).toBe(true)
    expect((element as HTMLElement).style.getPropertyValue('--sun-mark-size')).toBe('36px')
  })

  it('retires offscreen/hidden canvases and restarts only after a fresh draw', async () => {
    const activity = environment()
    const view = render(<SunMark />)
    const element = mark(view.container)
    activity.intersect(element, true)
    const first = await screen.findByTestId('sun-gpu-boundary')
    const retired = latestRenderer()
    act(() => retired.onReady?.())
    activity.intersect(element, false)
    expect(screen.queryByTestId('sun-gpu-boundary')).not.toBeInTheDocument()
    expect(element).toHaveAttribute('data-sun-state', 'pending')
    activity.intersect(element, true)
    expect(await screen.findByTestId('sun-gpu-boundary')).not.toBe(first)
    expect(element).toHaveAttribute('data-sun-state', 'loading')
    act(() => latestRenderer().onReady?.())
    expect(element).toHaveAttribute('data-sun-state', 'loaded')
    activity.visibility(true)
    expect(screen.queryByTestId('sun-gpu-boundary')).not.toBeInTheDocument()
    activity.visibility(false)
    await screen.findByTestId('sun-gpu-boundary')
    expect(element).toHaveAttribute('data-sun-state', 'loading')
  })

  it('changes reduced/disabled/zero-speed policy without losing the loaded scene', async () => {
    const activity = environment()
    const view = render(<SunMark rotationAxis="x" rotationSpeed={0.3} />)
    const element = mark(view.container)
    activity.intersect(element, true)
    const renderer = await screen.findByTestId('sun-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    expect(latestRenderer()).toMatchObject({ animate: true, rotationAxis: 'x', rotationSpeed: 0.3 })
    activity.reduced(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    expect(element).toHaveAttribute('data-sun-state', 'loaded')
    activity.reduced(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    view.rerender(<SunMark animate={false} />)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    view.rerender(<SunMark rotationSpeed={0} />)
    expect(element).toHaveAttribute('data-sun-animate', 'false')
    expect(screen.getByTestId('sun-gpu-boundary')).toBe(renderer)
  })

  it.each([false, true])('keeps touch scrolling native by disabling interaction on coarse pointers (%s)', async coarse => {
    const activity = environment({ coarse })
    const view = render(<SunMark />)
    activity.intersect(mark(view.container), true)
    await screen.findByTestId('sun-gpu-boundary')
    expect(latestRenderer().interactive).toBe(!coarse)
  })

  it('does not allocate a renderer in an initially hidden tab, and cleans stale observations/listeners', async () => {
    const activity = environment({ hidden: true })
    const add = vi.spyOn(document, 'addEventListener'), remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><SunMark /></StrictMode>)
    activity.intersect(mark(view.container), true)
    expect(SunMarkCanvas).not.toHaveBeenCalled()
    activity.visibility(false)
    await screen.findByTestId('sun-gpu-boundary')
    view.unmount()
    expect(activity.observers.every(observer => observer.disconnected)).toBe(true)
    add.mock.calls.filter(([name]) => name === 'visibilitychange').forEach(([name, listener]) => expect(remove).toHaveBeenCalledWith(name, listener))
    expect(activity.motion.listeners.size).toBe(0)
    expect(activity.pointer.listeners.size).toBe(0)
    const calls = vi.mocked(SunMarkCanvas).mock.calls.length
    act(() => activity.observers.forEach(observer => observer.emit(true)))
    activity.visibility(false)
    expect(SunMarkCanvas).toHaveBeenCalledTimes(calls)
  })

  it('can render without IntersectionObserver while remaining still for reduced motion', async () => {
    environment({ observe: false, reduced: true })
    const view = render(<SunMark />)
    await screen.findByTestId('sun-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    expect(mark(view.container)).toHaveAttribute('data-sun-state', 'loaded')
    expect(latestRenderer().animate).toBe(false)
  })

  it('leaves the badge empty without WebGL and keeps native sibling controls usable', async () => {
    const activity = environment({ webgl: false })
    const action = vi.fn(), user = userEvent.setup()
    const view = render(<><SunMark /><button onClick={action}>Continue research</button></>)
    const element = mark(view.container)
    activity.intersect(element, true)
    expect(element).toHaveAttribute('data-sun-state', 'unavailable')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
    expect(SunMarkCanvas).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continue research' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('contains an asset error locally and isolates repeated instances', async () => {
    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(SunMarkCanvas).mockImplementation(() => { throw new Error('Sun asset unavailable') })
    const view = render(<><SunMark size={24} /><SunMark size={48} /></>)
    const [first, second] = [...view.container.querySelectorAll('[data-sun-mark]')]
    activity.intersect(first, true)
    await waitFor(() => expect(first).toHaveAttribute('data-sun-state', 'unavailable'))
    expect(first.querySelector('svg')).not.toBeInTheDocument()
    expect(second).toHaveAttribute('data-sun-state', 'pending')
    vi.mocked(SunMarkCanvas).mockImplementation(({ animate }) => <div data-testid="sun-gpu-boundary" data-animate={Boolean(animate)} />)
    activity.intersect(second, true)
    await screen.findByTestId('sun-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    expect(second).toHaveAttribute('data-sun-state', 'loaded')
    expect(first).toHaveAttribute('data-sun-state', 'unavailable')
  })

  it('keeps the failed badge empty when an old renderer reports readiness', async () => {
    const activity = environment()
    const view = render(<SunMark />)
    const element = mark(view.container)
    activity.intersect(element, true)
    await screen.findByTestId('sun-gpu-boundary')
    const renderer = latestRenderer()
    act(() => renderer.onUnavailable?.())
    expect(element).toHaveAttribute('data-sun-state', 'unavailable')
    expect(screen.queryByTestId('sun-gpu-boundary')).not.toBeInTheDocument()
    act(() => renderer.onReady?.())
    expect(element).toHaveAttribute('data-sun-state', 'unavailable')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
  })

  it('preserves existing source-card fields, focus and actions through legacy-scene retirement and remount', async () => {
    const activity = environment(), action = vi.fn(), user = userEvent.setup()
    render(<NewUserCard headingId="sun-card-heading" title="Source scene card" controls={<button onClick={action}>Edit card</button>}><label>Output notes<textarea /></label></NewUserCard>)
    const badge = document.querySelector('[data-source-sun]')!
    activity.intersect(badge, true)
    await waitFor(() => expect(document.querySelector('[data-sun-mark]')).toBeInTheDocument())
    activity.intersect(document.querySelector('[data-sun-mark]')!, true)
    await screen.findByTestId('sun-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    const field = screen.getByRole('textbox', { name: 'Output notes' })
    await user.type(field, 'Research draft')
    activity.visibility(true)
    expect(screen.queryByTestId('sun-gpu-boundary')).not.toBeInTheDocument()
    activity.visibility(false)
    await waitFor(() => expect(document.querySelector('[data-sun-mark]')).toBeInTheDocument())
    activity.intersect(document.querySelector('[data-sun-mark]')!, true)
    await screen.findByTestId('sun-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    expect(screen.getByRole('textbox', { name: 'Output notes' })).toBe(field)
    expect(field).toHaveValue('Research draft')
    expect(field).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Edit card' }))
    expect(action).toHaveBeenCalledOnce()
    expect(localStorage.length).toBe(0)
  })
})
