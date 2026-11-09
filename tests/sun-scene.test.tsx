import { StrictMode, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SunRenderer from '../src/components/react three fibre/sunScene/SunRenderer'
import SunScene from '../src/components/react three fibre/sunScene/SunScene'
import NewUserCard from '../src/components/cards/newUserCard/NewUserCard'

// Mock only the GPU boundary. SunScene's visibility, readiness, lifecycle,
// preference handling and error boundary remain the real implementation.
vi.mock('../src/components/react three fibre/sunScene/SunRenderer', () => ({ default: vi.fn() }))

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

beforeEach(() => {
  vi.mocked(SunRenderer).mockImplementation(function Renderer({ reducedMotion }) {
    useEffect(() => { mounted(); return () => { unmounted() } }, [])
    return <div data-testid="gpu-renderer" data-reduced-motion={String(reducedMotion)} />
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Sun scene activation and lifecycle', () => {
  it.each(['WebGL2RenderingContext', 'IntersectionObserver'])('uses the real static fallback when %s is unavailable', missing => {
    browserEnvironment()
    vi.stubGlobal(missing, undefined)
    const error = vi.spyOn(console, 'error')
    const warning = vi.spyOn(console, 'warn')
    render(<SunScene />)

    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
    expect(screen.getByTestId('sun-scene')).toHaveTextContent('☀')
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(document.querySelector('canvas')).toBeNull()
    expect(SunRenderer).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()
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

  it('contains renderer failure callbacks and keeps the fallback through later visibility changes', async () => {
    const environment = browserEnvironment()
    render(<SunScene />)
    environment.observers[0].intersect(true)
    await screen.findByTestId('gpu-renderer')
    const { onReady, onFailure } = rendererProps()
    act(() => onFailure())

    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
    expect(screen.queryByTestId('gpu-renderer')).not.toBeInTheDocument()
    expect(unmounted).toHaveBeenCalledOnce()
    act(() => onReady())
    environment.observers[0].intersect(false)
    environment.observers[0].intersect(true)
    environment.visibility(false)
    environment.visibility(true)
    expect(screen.getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
    expect(mounted).toHaveBeenCalledOnce()
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

    expect(await within(card).findByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
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
