import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FooterTextScene from '../src/components/typography/FooterTextScene'
import FooterTextCanvas from '../src/components/typography/FooterTextCanvas'

vi.mock('../src/components/typography/FooterTextCanvas', () => ({ default: vi.fn() }))

function environment({ reduced = false, webgl = true, hidden = false, observe = true } = {}) {
  const listeners = new Set<() => void>()
  const media = {
    matches: reduced,
    addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)),
    addListener: vi.fn(), removeListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
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
    observers, media, listeners,
    intersect(target: Element, intersecting: boolean) {
      act(() => observers.filter(observer => observer.target === target && !observer.disconnected).forEach(observer => observer.emit(intersecting)))
    },
    visibility(hidden: boolean) {
      act(() => { visibility = hidden ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')) })
    },
    reduced(matches: boolean) {
      act(() => { media.matches = matches; listeners.forEach(listener => listener()) })
    },
  }
}

function latestRenderer() { return vi.mocked(FooterTextCanvas).mock.calls.at(-1)![0] }

beforeEach(() => {
  vi.mocked(FooterTextCanvas).mockImplementation(({ animate, text }) => (
    <div data-testid="footer-gpu-boundary" data-animate={animate} data-text={text} aria-hidden="true" />
  ))
})

afterEach(() => { vi.unstubAllGlobals() })

describe('reusable footer text scene', () => {
  it('keeps an accessible text alternative and waits for visibility and actual readiness under StrictMode', async () => {
    const activity = environment()
    const view = render(<StrictMode><FooterTextScene /></StrictMode>)
    const region = screen.getByRole('img', { name: 'Make learning tangible.' })
    const fallback = region.querySelector('p')!
    expect(fallback).toHaveTextContent('Make learning tangible.')
    expect(fallback).toHaveAttribute('aria-hidden', 'true')
    expect(region).toHaveAttribute('data-footer-text-state', 'pending')
    expect(FooterTextCanvas).not.toHaveBeenCalled()

    activity.intersect(region, true)
    const renderer = await screen.findByTestId('footer-gpu-boundary')
    expect(region).toHaveAttribute('data-footer-text-state', 'loading')
    expect(fallback).toBeInTheDocument()
    expect(renderer).toHaveAttribute('data-animate', 'true')
    act(() => latestRenderer().onReady?.())
    expect(region).toHaveAttribute('data-footer-text-state', 'loaded')
    expect(region.querySelector('p')).not.toBeInTheDocument()
    expect(region).toHaveAccessibleName('Make learning tangible.')
    expect(screen.getByTestId('footer-gpu-boundary')).toBe(renderer)
    view.unmount()
    expect(activity.observers.every(observer => observer.disconnected)).toBe(true)
    expect(activity.listeners.size).toBe(0)
  })

  it('pauses the same loaded renderer offscreen, hidden, and reduced, then resumes when eligible', async () => {
    const activity = environment()
    const view = render(<FooterTextScene text="Research becomes an application." />)
    const region = screen.getByRole('img', { name: 'Research becomes an application.' })
    activity.intersect(region, true)
    const renderer = await screen.findByTestId('footer-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    activity.intersect(region, false)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.intersect(region, true)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    activity.visibility(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.visibility(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    activity.reduced(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.reduced(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    view.rerender(<FooterTextScene text="Revised reusable message." />)
    expect(region).toHaveAccessibleName('Revised reusable message.')
    expect(renderer).toHaveAttribute('data-text', 'Revised reusable message.')
    expect(screen.getByTestId('footer-gpu-boundary')).toBe(renderer)
    expect(region).toHaveAttribute('data-footer-text-state', 'loaded')
  })

  it('defers loading in a hidden document and removes subscriptions and stale observer deliveries on unmount', async () => {
    const activity = environment({ hidden: true })
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<FooterTextScene />)
    const region = screen.getByRole('img', { name: 'Make learning tangible.' })
    activity.intersect(region, true)
    expect(FooterTextCanvas).not.toHaveBeenCalled()
    activity.visibility(false)
    await screen.findByTestId('footer-gpu-boundary')
    const callbacks = latestRenderer()
    const listener = add.mock.calls.find(([name]) => name === 'visibilitychange')![1]
    const observer = activity.observers.at(-1)!
    view.unmount()
    expect(remove).toHaveBeenCalledWith('visibilitychange', listener)
    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(activity.listeners.size).toBe(0)
    const count = vi.mocked(FooterTextCanvas).mock.calls.length
    act(() => { observer.emit(true); callbacks.onReady?.(); callbacks.onUnavailable?.() })
    expect(FooterTextCanvas).toHaveBeenCalledTimes(count)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('keeps text and native sibling form controls usable without WebGL', async () => {
    const activity = environment({ webgl: false })
    const submit = vi.fn()
    const user = userEvent.setup()
    render(<form onSubmit={event => { event.preventDefault(); submit() }}><label>Research draft<input /></label><FooterTextScene /><button type="submit">Save draft</button></form>)
    const region = screen.getByRole('img', { name: 'Make learning tangible.' })
    activity.intersect(region, true)
    expect(region).toHaveAttribute('data-footer-text-state', 'unavailable')
    expect(region.querySelector('p')).toHaveTextContent('Make learning tangible.')
    expect(FooterTextCanvas).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Research draft' }), 'A native draft')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(submit).toHaveBeenCalledOnce()
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toHaveValue('A native draft')
    expect(localStorage.length).toBe(0)
  })

  it('still loads without IntersectionObserver and honors the initial reduced preference', async () => {
    environment({ observe: false, reduced: true })
    render(<FooterTextScene />)
    const renderer = await screen.findByTestId('footer-gpu-boundary')
    expect(renderer).toHaveAttribute('data-animate', 'false')
    const region = screen.getByRole('img', { name: 'Make learning tangible.' })
    expect(region).toHaveAttribute('data-footer-text-animate', 'false')
    act(() => latestRenderer().onReady?.())
    expect(region).toHaveAttribute('data-footer-text-state', 'loaded')
  })

  it('returns to text after renderer failure and ignores stale readiness without replacing focused controls', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<><label>Keep this draft<input /></label><FooterTextScene /></>)
    const input = screen.getByRole('textbox', { name: 'Keep this draft' })
    await user.type(input, 'Still focused')
    const region = screen.getByRole('img', { name: 'Make learning tangible.' })
    activity.intersect(region, true)
    await screen.findByTestId('footer-gpu-boundary')
    const callbacks = latestRenderer()
    act(() => callbacks.onReady?.())
    expect(region).toHaveAttribute('data-footer-text-state', 'loaded')
    act(() => callbacks.onUnavailable?.())
    expect(region).toHaveAttribute('data-footer-text-state', 'unavailable')
    expect(region.querySelector('p')).toHaveTextContent('Make learning tangible.')
    expect(screen.queryByTestId('footer-gpu-boundary')).not.toBeInTheDocument()
    act(() => { callbacks.onReady?.(); callbacks.onUnavailable?.() })
    activity.intersect(region, false)
    activity.intersect(region, true)
    expect(region).toHaveAttribute('data-footer-text-state', 'unavailable')
    expect(screen.queryByTestId('footer-gpu-boundary')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Keep this draft' })).toBe(input)
    expect(input).toHaveValue('Still focused')
    expect(input).toHaveFocus()
  })

  it('contains a thrown renderer error locally and preserves the accessible message and neighboring action', async () => {
    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(FooterTextCanvas).mockImplementation(() => { throw new Error('Local font unavailable') })
    const action = vi.fn()
    const user = userEvent.setup()
    render(<><FooterTextScene text="Reusable message after failure." /><button onClick={action}>Continue research</button></>)
    const region = screen.getByRole('img', { name: 'Reusable message after failure.' })
    activity.intersect(region, true)
    await waitFor(() => expect(region).toHaveAttribute('data-footer-text-state', 'unavailable'))
    expect(region.querySelector('p')).toHaveTextContent('Reusable message after failure.')
    await user.click(screen.getByRole('button', { name: 'Continue research' }))
    expect(action).toHaveBeenCalledOnce()
  })
})
