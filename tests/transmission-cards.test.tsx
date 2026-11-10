import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CinematicTransmissionCard, RoundedTransmissionCard, TransmissionGallery,
} from '../src/components/transmission/GlassCards'
import TransmissionCanvas from '../src/components/transmission/TransmissionCanvas'
import { clearTransmissionAssetCache } from '../src/components/transmission/transmissionAssets'

vi.mock('../src/components/transmission/TransmissionCanvas', () => ({ default: vi.fn() }))
vi.mock('../src/components/transmission/transmissionAssets', () => ({ clearTransmissionAssetCache: vi.fn() }))

function environment({ reduced = false, coarse = false, hidden = false, webgl = true, observe = true } = {}) {
  function media(matches: boolean) {
    const listeners = new Set<() => void>()
    return {
      matches, listeners,
      addEventListener: vi.fn((_name: string, callback: () => void) => listeners.add(callback)),
      removeEventListener: vi.fn((_name: string, callback: () => void) => listeners.delete(callback)),
      addListener: vi.fn(), removeListener: vi.fn(),
    }
  }
  const motion = media(reduced), pointer = media(coarse)
  vi.stubGlobal('matchMedia', vi.fn((query: string) => query.includes('reduced-motion') ? motion : pointer))
  vi.stubGlobal('WebGLRenderingContext', webgl ? class {} : undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  let visibility = hidden ? 'hidden' : 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility as DocumentVisibilityState)
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    disconnected = false
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    observe = vi.fn((element: Element) => { this.target = element })
    disconnect = vi.fn(() => { this.disconnected = true })
    emit(visible: boolean) {
      this.callback([{ target: this.target!, isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
  }
  vi.stubGlobal('IntersectionObserver', observe ? Observer : undefined)
  return {
    observers, motion, pointer,
    intersect(visible: boolean) {
      act(() => observers.filter(observer => !observer.disconnected).forEach(observer => observer.emit(visible)))
    },
    visibility(hidden: boolean) {
      act(() => { visibility = hidden ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')) })
    },
    reduced(value: boolean) {
      act(() => { motion.matches = value; motion.listeners.forEach(callback => callback()) })
    },
    coarse(value: boolean) {
      act(() => { pointer.matches = value; pointer.listeners.forEach(callback => callback()) })
    },
  }
}

function latest() { return vi.mocked(TransmissionCanvas).mock.calls.at(-1)![0] }
function card(container: HTMLElement) { return container.querySelector('[data-transmission-state]')! }

beforeEach(() => {
  vi.mocked(TransmissionCanvas).mockImplementation(({ animate, interactive }) => (
    <div data-testid="transmission-gpu-boundary" data-animate={animate} data-interactive={interactive} />
  ))
})
afterEach(() => { vi.unstubAllGlobals() })

describe('native transmission card controls and GPU lifecycle', () => {
  it('defers the scene until both stage and document are visible, then waits for a real readiness callback before animating', async () => {
    const activity = environment({ hidden: true })
    const view = render(<StrictMode><RoundedTransmissionCard /></StrictMode>)
    const element = card(view.container)
    expect(element).toHaveAttribute('data-transmission-state', 'pending')
    expect(TransmissionCanvas).not.toHaveBeenCalled()
    activity.intersect(true)
    expect(TransmissionCanvas).not.toHaveBeenCalled()
    activity.visibility(false)
    const renderer = await screen.findByTestId('transmission-gpu-boundary')
    expect(element).toHaveAttribute('data-transmission-state', 'loading')
    expect(renderer).toHaveAttribute('data-animate', 'false')
    act(() => latest().onReady())
    expect(element).toHaveAttribute('data-transmission-state', 'loaded')
    expect(renderer).toHaveAttribute('data-animate', 'true')
    expect(screen.getByTestId('transmission-gpu-boundary')).toBe(renderer)
  })

  it('forwards native edits to the same scene and retains controls, text and tuning when switching gallery variants', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<TransmissionGallery />)
    activity.intersect(true)
    const renderer = await screen.findByTestId('transmission-gpu-boundary')
    const input = screen.getByRole('textbox', { name: 'Lettering' })
    await user.clear(input)
    await user.type(input, '  IDEA  ')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Text placement' }), 'inside')
    fireEvent.change(screen.getByRole('slider', { name: /Text depth offset/ }), { target: { value: '0.42' } })
    await user.click(screen.getByRole('checkbox', { name: 'Glass lettering' }))
    for (const [label, value] of [
      ['Transmission', '0.65'], ['Thickness', '0.9'], ['Refraction index', '1.6'],
      ['Chromatic aberration', '0.08'], ['Roughness', '0.17'],
    ]) fireEvent.change(screen.getByRole('slider', { name: new RegExp(`^${label}:`) }), { target: { value } })
    expect(latest()).toMatchObject({
      variant: 'panel', text: 'IDEA', placement: 'inside', textDepth: 0.42, glassText: true,
      settings: { transmission: 0.65, thickness: 0.9, ior: 1.6, chromaticAberration: 0.08, roughness: 0.17 },
    })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Card version' }), 'cinematic')
    expect(latest()).toMatchObject({ variant: 'cinematic', text: 'IDEA', placement: 'inside', glassText: true, textDepth: 0.42 })
    expect(latest().settings.transmission).toBe(0.65)
    expect(screen.getAllByTestId('transmission-gpu-boundary')).toEqual([renderer])
    expect(screen.getByRole('textbox', { name: 'Lettering' })).toBe(input)
    expect(input).toHaveValue('  IDEA  ')
    expect(localStorage.length).toBe(0)
  })

  it('pauses motion and interaction during native editing, and honors live visibility, motion preference and motion control changes', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<><RoundedTransmissionCard /><button>Outside scene</button></>)
    activity.intersect(true)
    const renderer = await screen.findByTestId('transmission-gpu-boundary')
    act(() => latest().onReady())
    expect(renderer).toHaveAttribute('data-animate', 'true')
    const input = screen.getByRole('textbox', { name: 'Lettering' })
    await user.click(input)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    expect(renderer).toHaveAttribute('data-interactive', 'false')
    await user.type(input, 'S')
    expect(input).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Outside scene' }))
    expect(renderer).toHaveAttribute('data-animate', 'true')
    activity.intersect(false)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    expect(renderer).toHaveAttribute('data-interactive', 'false')
    activity.intersect(true)
    activity.visibility(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.visibility(false)
    activity.reduced(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.reduced(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    await user.click(screen.getByRole('checkbox', { name: 'Gentle motion' }))
    await user.click(screen.getByRole('button', { name: 'Outside scene' }))
    expect(renderer).toHaveAttribute('data-animate', 'false')
    expect(screen.getByTestId('transmission-gpu-boundary')).toBe(renderer)
  })

  it('adapts automatic quality to pointer capability while retaining an explicit quality selection', async () => {
    const activity = environment({ coarse: true })
    const user = userEvent.setup()
    render(<CinematicTransmissionCard />)
    activity.intersect(true)
    await screen.findByTestId('transmission-gpu-boundary')
    expect(latest()).toMatchObject({ variant: 'cinematic', coarse: true, high: false, settings: { samples: 4, resolution: 256, backside: false } })
    activity.coarse(false)
    expect(latest()).toMatchObject({ coarse: false, high: true, settings: { samples: 6, resolution: 512, backside: true } })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Quality' }), 'balanced')
    activity.coarse(true)
    activity.coarse(false)
    expect(latest()).toMatchObject({ high: false, settings: { samples: 4, resolution: 256, backside: false } })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Quality' }), 'high')
    expect(latest().high).toBe(true)
  })

  it('preserves native values and focus after failure, and ignores old callbacks after an explicit retry or unmount', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const view = render(<RoundedTransmissionCard />)
    activity.intersect(true)
    await screen.findByTestId('transmission-gpu-boundary')
    const old = latest()
    const input = screen.getByRole('textbox', { name: 'Lettering' })
    await user.clear(input)
    await user.type(input, 'STAYS')
    act(() => old.onUnavailable())
    expect(card(view.container)).toHaveAttribute('data-transmission-state', 'unavailable')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('STAYS')
    expect(screen.queryByTestId('transmission-gpu-boundary')).not.toBeInTheDocument()
    act(() => old.onReady())
    expect(card(view.container)).toHaveAttribute('data-transmission-state', 'unavailable')

    await user.click(screen.getByRole('button', { name: 'Retry 3D preview' }))
    const renderer = await screen.findByTestId('transmission-gpu-boundary')
    const current = latest()
    expect(latest().text).toBe('STAYS')
    expect(screen.getByRole('textbox', { name: 'Lettering' })).toBe(input)
    act(() => { old.onReady(); old.onUnavailable() })
    expect(card(view.container)).toHaveAttribute('data-transmission-state', 'loading')
    act(() => current.onReady())
    expect(card(view.container)).toHaveAttribute('data-transmission-state', 'loaded')
    act(() => old.onUnavailable())
    expect(screen.getByTestId('transmission-gpu-boundary')).toBe(renderer)
    view.unmount()
    act(() => { current.onReady(); current.onUnavailable() })
    expect(screen.queryByTestId('transmission-gpu-boundary')).not.toBeInTheDocument()
  })

  it('evicts asset failures only for an explicit retry, retaining caches for a healthy reset or a context-only failure', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<RoundedTransmissionCard initialText="KEEP" />)
    activity.intersect(true)
    await screen.findByTestId('transmission-gpu-boundary')
    act(() => latest().onReady())
    await user.click(screen.getByRole('button', { name: 'Reset 3D view' }))
    await screen.findByTestId('transmission-gpu-boundary')
    expect(clearTransmissionAssetCache).not.toHaveBeenCalled()

    act(() => { latest().onReady(); latest().onUnavailable('context') })
    expect(clearTransmissionAssetCache).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Retry 3D preview' }))
    await screen.findByTestId('transmission-gpu-boundary')
    expect(clearTransmissionAssetCache).not.toHaveBeenCalled()

    act(() => latest().onUnavailable())
    expect(clearTransmissionAssetCache).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Retry 3D preview' }))
    await screen.findByTestId('transmission-gpu-boundary')
    expect(clearTransmissionAssetCache).toHaveBeenCalledOnce()
    expect(latest().text).toBe('KEEP')
    expect(screen.getByRole('textbox', { name: 'Lettering' })).toHaveValue('KEEP')
  })

  it('keeps native configuration usable without WebGL and contains thrown renderer failures locally', async () => {
    environment({ webgl: false })
    const user = userEvent.setup()
    const view = render(<RoundedTransmissionCard />)
    expect(card(view.container)).toHaveAttribute('data-transmission-state', 'unavailable')
    expect(TransmissionCanvas).not.toHaveBeenCalled()
    await user.clear(screen.getByRole('textbox', { name: 'Lettering' }))
    await user.type(screen.getByRole('textbox', { name: 'Lettering' }), 'NATIVE')
    view.unmount()

    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(TransmissionCanvas).mockImplementation(() => { throw new Error('Local HDR failed') })
    const failed = render(<CinematicTransmissionCard initialText="KEPT" />)
    activity.intersect(true)
    await waitFor(() => expect(card(failed.container)).toHaveAttribute('data-transmission-state', 'unavailable'))
    expect(screen.getByRole('textbox', { name: 'Lettering' })).toHaveValue('KEPT')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Text placement' }), 'intersecting')
    expect(screen.getByRole('combobox', { name: 'Text placement' })).toHaveValue('intersecting')
    expect(localStorage.length).toBe(0)
  })

  it('releases activity subscriptions under StrictMode, ignores queued observers and supports missing IntersectionObserver', async () => {
    const activity = environment()
    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><RoundedTransmissionCard /></StrictMode>)
    activity.intersect(true)
    await screen.findByTestId('transmission-gpu-boundary')
    const observer = activity.observers.at(-1)!
    const listener = added.mock.calls.filter(([name]) => name === 'visibilitychange').at(-1)![1]
    view.unmount()
    expect(activity.observers.every(value => value.disconnected)).toBe(true)
    expect(activity.motion.listeners.size).toBe(0)
    expect(activity.pointer.listeners.size).toBe(0)
    expect(removed).toHaveBeenCalledWith('visibilitychange', listener)
    const calls = vi.mocked(TransmissionCanvas).mock.calls.length
    act(() => observer.emit(true))
    expect(TransmissionCanvas).toHaveBeenCalledTimes(calls)

    environment({ observe: false, reduced: true })
    render(<CinematicTransmissionCard />)
    const renderer = await screen.findByTestId('transmission-gpu-boundary')
    act(() => latest().onReady())
    expect(renderer).toHaveAttribute('data-animate', 'false')
  })
})
