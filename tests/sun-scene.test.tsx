import { StrictMode, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SunRenderer from '../src/components/react three fibre/sunScene/SunRenderer'
import SunScene from '../src/components/react three fibre/sunScene/SunScene'
import NewUserCard from '../src/components/cards/newUserCard/NewUserCard'
import { SUN_PREVIEW_URL, clearSunAssetCache, preloadSunAssets } from '../src/components/react three fibre/sunScene/sunAssets'

// Mock only the GPU boundary. SunScene's visibility, readiness, lifecycle,
// preference handling and error boundary remain the real implementation.
vi.mock('../src/components/react three fibre/sunScene/SunRenderer', () => ({ default: vi.fn() }))
vi.mock('../src/components/react three fibre/sunScene/sunAssets', async importOriginal => ({
  ...await importOriginal<typeof import('../src/components/react three fibre/sunScene/sunAssets')>(),
  preloadSunAssets: vi.fn(),
  clearSunAssetCache: vi.fn(),
}))

const mounted = vi.fn()
const unmounted = vi.fn()

function browserEnvironment({ visible = true, reduced = false } = {}) {
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    observe = vi.fn((target: Element) => { this.target = target })
    disconnect = vi.fn()
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    intersect(isIntersecting: boolean) {
      act(() => this.callback(
        [{ isIntersecting, target: this.target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ))
    }
  }
  vi.stubGlobal('IntersectionObserver', Observer)
  vi.stubGlobal('WebGL2RenderingContext', class {})

  function query(matches: boolean) {
    const listeners = new Set<() => void>()
    const media = {
      matches,
      addEventListener: vi.fn((_type: string, callback: () => void) => listeners.add(callback)),
      removeEventListener: vi.fn((_type: string, callback: () => void) => listeners.delete(callback)),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
    return { media, listeners }
  }
  const reducedMotion = query(reduced)
  const coarsePointer = query(false)
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('prefers-reduced-motion') ? reducedMotion.media : coarsePointer.media))
  let visibility: DocumentVisibilityState = visible ? 'visible' : 'hidden'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)

  return {
    observers,
    reducedMotion,
    coarsePointer,
    visibility(visible: boolean) {
      act(() => {
        visibility = visible ? 'visible' : 'hidden'
        document.dispatchEvent(new Event('visibilitychange'))
      })
    },
    reduce(matches: boolean) {
      act(() => {
        reducedMotion.media.matches = matches
        reducedMotion.listeners.forEach(callback => callback())
      })
    },
  }
}

function rendererProps() {
  return vi.mocked(SunRenderer).mock.calls.at(-1)![0]
}

async function advanceRetryClock() {
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
}

beforeEach(() => {
  vi.mocked(preloadSunAssets).mockResolvedValue(undefined)
  vi.mocked(clearSunAssetCache).mockResolvedValue(undefined)
  vi.mocked(SunRenderer).mockImplementation(function Renderer({ reducedMotion }) {
    useEffect(() => { mounted(); return () => { unmounted() } }, [])
    return <div data-testid="gpu-renderer" data-reduced-motion={String(reducedMotion)} />
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Sun scene activation and lifecycle', () => {
  it('uses the actual model preview without canvas warnings when WebGL is unavailable', () => {
    browserEnvironment()
    vi.stubGlobal('WebGL2RenderingContext', undefined)
    const error = vi.spyOn(console, 'error')
    const warning = vi.spyOn(console, 'warn')
    render(<SunScene />)

    const scene = screen.getByTestId('sun-scene')
    expect(scene).toHaveAttribute('data-sun-state', 'fallback')
    expect(scene).not.toHaveTextContent('☀')
    expect(scene.querySelector('img')).toHaveAttribute('src', SUN_PREVIEW_URL)
    expect(scene.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(document.querySelector('canvas')).toBeNull()
    expect(SunRenderer).not.toHaveBeenCalled()
    expect(preloadSunAssets).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()
  })

  it('warms assets before viewport entry without mistaking warmup completion for renderer readiness', async () => {
    const environment = browserEnvironment({ visible: false })
    render(<StrictMode><SunScene /><SunScene /></StrictMode>)
    await act(async () => { await Promise.resolve() })

    expect(preloadSunAssets).toHaveBeenCalled()
    expect(SunRenderer).not.toHaveBeenCalled()
    for (const scene of screen.getAllByTestId('sun-scene')) {
      expect(scene).toHaveAttribute('data-sun-state', 'inactive')
      expect(scene.querySelector('img')).toHaveAttribute('src', SUN_PREVIEW_URL)
    }
    // The active observers are the last two after StrictMode effect replay.
    environment.observers.slice(-2).forEach(observer => observer.intersect(true))
    expect(SunRenderer).not.toHaveBeenCalled()
  })

  it('keeps warmup rejection contained and still permits a later successful renderer', async () => {
    const environment = browserEnvironment()
    vi.mocked(preloadSunAssets).mockRejectedValueOnce(new Error('Warmup unavailable'))
    render(<SunScene />)
    await act(async () => { await Promise.resolve() })
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'inactive')

    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    act(() => rendererProps().onReady())
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'ready')
  })

  it.each(['missing', 'throwing'])('uses viewport measurements and cleans listeners when IntersectionObserver is %s', async mode => {
    const environment = browserEnvironment()
    if (mode === 'missing') vi.stubGlobal('IntersectionObserver', undefined)
    else vi.stubGlobal('IntersectionObserver', class { constructor() { throw new Error('Observer unavailable') } })
    let top = 10
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => new DOMRect(10, top, 50, 50))
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')
    const view = render(<SunScene />)
    const scene = screen.getByTestId('sun-scene')
    await screen.findByTestId('gpu-renderer')
    expect(scene).toHaveAttribute('data-sun-state', 'loading')
    act(() => rendererProps().onReady())
    expect(scene).toHaveAttribute('data-sun-state', 'ready')

    top = window.innerHeight + 100
    act(() => window.dispatchEvent(new Event('scroll')))
    expect(scene).toHaveAttribute('data-sun-state', 'inactive')
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    top = 10
    act(() => window.dispatchEvent(new Event('resize')))
    await screen.findByTestId('gpu-renderer')
    environment.visibility(false)
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    environment.visibility(true)
    await screen.findByTestId('gpu-renderer')

    const scroll = added.mock.calls.find(([name]) => name === 'scroll')![1]
    const resize = added.mock.calls.find(([name]) => name === 'resize')![1]
    view.unmount()
    expect(removed).toHaveBeenCalledWith('scroll', scroll, true)
    expect(removed).toHaveBeenCalledWith('resize', resize)
  })

  it('activates only when both viewport and document are visible, waits for readiness, and updates reduced motion without remounting', async () => {
    const environment = browserEnvironment({ visible: false, reduced: true })
    render(<SunScene />)
    const scene = screen.getByTestId('sun-scene')
    expect(scene).toHaveAttribute('data-sun-state', 'inactive')
    environment.observers[0].intersect(true)
    expect(SunRenderer).not.toHaveBeenCalled()
    environment.observers[0].intersect(false)
    environment.visibility(true)
    expect(SunRenderer).not.toHaveBeenCalled()

    environment.observers[0].intersect(true)
    const renderer = await screen.findByTestId('gpu-renderer')
    expect(scene).toHaveAttribute('data-sun-state', 'loading')
    expect(renderer).toHaveAttribute('data-reduced-motion', 'true')
    act(() => rendererProps().onReady())
    expect(scene).toHaveAttribute('data-sun-state', 'ready')

    environment.reduce(false)
    expect(screen.getByTestId('gpu-renderer')).toBe(renderer)
    expect(renderer).toHaveAttribute('data-reduced-motion', 'false')
    expect(scene).toHaveAttribute('data-sun-state', 'ready')
    expect(mounted).toHaveBeenCalledOnce()
    expect(unmounted).not.toHaveBeenCalled()
  })

  it('unmounts inactive renderers and requires fresh readiness on reentry, ignoring a stale ready callback', async () => {
    const environment = browserEnvironment()
    render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    const oldReady = rendererProps().onReady
    act(() => oldReady())
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'ready')

    environment.observers[0].intersect(false)
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(unmounted).toHaveBeenCalledOnce()
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'inactive')
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    expect(mounted).toHaveBeenCalledTimes(2)
    act(() => oldReady())
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'loading')
    act(() => rendererProps().onReady())
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'ready')

    environment.visibility(false)
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(unmounted).toHaveBeenCalledTimes(2)
    environment.visibility(true)
    await screen.findByTestId('gpu-renderer')
    expect(mounted).toHaveBeenCalledTimes(3)
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'loading')
  })

  it('recovers from transient failure and ignores stale ready and failure callbacks after success', async () => {
    const environment = browserEnvironment()
    render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    const previous = rendererProps()
    vi.useFakeTimers()
    act(() => previous.onFailure())

    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(unmounted).toHaveBeenCalledOnce()
    expect(screen.getByTestId('sun-scene').querySelector('img')).toHaveAttribute('src', SUN_PREVIEW_URL)
    await advanceRetryClock()
    expect(clearSunAssetCache).toHaveBeenCalledOnce()
    expect(screen.getByTestId('gpu-renderer')).toBeInTheDocument()
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'loading')
    act(() => rendererProps().onReady())
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'ready')
    act(() => { previous.onReady(); previous.onFailure() })
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'ready')
    expect(mounted).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('exhausts two retries and retains the preview without restarting its budget on visibility changes', async () => {
    const environment = browserEnvironment()
    render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    vi.useFakeTimers()

    for (let attempt = 0; attempt < 3; attempt++) {
      act(() => rendererProps().onFailure())
      expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
      if (attempt < 2) {
        environment.visibility(false)
        environment.visibility(true)
        await advanceRetryClock()
        expect(screen.getByTestId('gpu-renderer')).toBeInTheDocument()
      }
    }
    environment.observers[0].intersect(false)
    environment.observers[0].intersect(true)
    environment.visibility(false)
    environment.visibility(true)
    await advanceRetryClock()

    expect(clearSunAssetCache).toHaveBeenCalledTimes(2)
    expect(mounted).toHaveBeenCalledTimes(3)
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
    expect(screen.getByTestId('sun-scene').querySelector('img')).toHaveAttribute('src', SUN_PREVIEW_URL)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['offscreen', 'hidden'])('pauses recovery timers while %s and resumes when visible', async pause => {
    const environment = browserEnvironment()
    render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    vi.useFakeTimers()
    act(() => rendererProps().onFailure())
    expect(vi.getTimerCount()).toBe(1)

    if (pause === 'offscreen') environment.observers[0].intersect(false)
    else environment.visibility(false)
    expect(vi.getTimerCount()).toBe(0)
    await advanceRetryClock()
    expect(clearSunAssetCache).not.toHaveBeenCalled()
    if (pause === 'offscreen') environment.observers[0].intersect(true)
    else environment.visibility(true)
    await advanceRetryClock()

    expect(clearSunAssetCache).toHaveBeenCalledOnce()
    expect(screen.getByTestId('gpu-renderer')).toBeInTheDocument()
  })

  it('cancels pending recovery when unmounted', async () => {
    const environment = browserEnvironment()
    const view = render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    vi.useFakeTimers()
    act(() => rendererProps().onFailure())
    expect(vi.getTimerCount()).toBe(1)

    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
    await advanceRetryClock()
    expect(clearSunAssetCache).not.toHaveBeenCalled()
    expect(mounted).toHaveBeenCalledOnce()
  })

  it('does not remount after an in-flight cache reset resolves following unmount', async () => {
    const environment = browserEnvironment()
    let finishReset!: () => void
    vi.mocked(clearSunAssetCache).mockImplementationOnce(() => new Promise<void>(resolve => { finishReset = resolve }))
    const view = render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    vi.useFakeTimers()
    act(() => rendererProps().onFailure())
    await advanceRetryClock()
    expect(clearSunAssetCache).toHaveBeenCalledOnce()

    view.unmount()
    await act(async () => { finishReset(); await Promise.resolve() })
    expect(mounted).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.queryByTestId('sun-scene')).not.toBeInTheDocument()
  })

  it('catches renderer throws without losing surrounding card text or native controls', async () => {
    const environment = browserEnvironment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(SunRenderer).mockImplementation(() => { throw new Error('GPU initialization failed') })
    const action = vi.fn()
    const user = userEvent.setup()
    render(<NewUserCard headingId="failure-card-heading" title="Usable research card" controls={<button type="button" onClick={action}>Keep working</button>}><p>Research content remains available.</p></NewUserCard>)
    const card = screen.getByRole('region', { name: 'Usable research card' })
    environment.observers[0].intersect(true)

    await waitFor(() => expect(within(card).getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback'))
    expect(within(card).getByText('Research content remains available.')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'CC BY 4.0' })).toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: 'Keep working' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('cleans observers, document visibility listeners, and media subscriptions under StrictMode', () => {
    const environment = browserEnvironment()
    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><SunScene /></StrictMode>)
    const callbacks = added.mock.calls.filter(([name]) => name === 'visibilitychange').map(([, callback]) => callback)
    expect(callbacks.length).toBeGreaterThan(0)

    view.unmount()
    for (const observer of environment.observers) expect(observer.disconnect).toHaveBeenCalledOnce()
    for (const callback of callbacks) expect(removed).toHaveBeenCalledWith('visibilitychange', callback)
    expect(environment.reducedMotion.listeners.size).toBe(0)
    expect(environment.coarsePointer.listeners.size).toBe(0)
  })
})
