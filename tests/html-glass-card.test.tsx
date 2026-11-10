import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HtmlGlassCard from '../src/components/html-glass-card/HtmlGlassCard'
import HtmlGlassCanvas from '../src/components/html-glass-card/HtmlGlassCanvas'
import { moveHtmlHost } from '../src/components/html-glass-card/moveHtmlHost'

vi.mock('../src/components/html-glass-card/HtmlGlassCanvas', () => ({ default: vi.fn() }))
// The native card now contains a second, decorative GPU boundary for its title.
vi.mock('../src/components/typography/FooterTextCanvas', () => ({ default: () => null }))

function environment({ reduced = false, hidden = false, webgl = true, observe = true } = {}) {
  const listeners = new Set<() => void>()
  const media = { matches: reduced, addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)), removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)), addListener: vi.fn(), removeListener: vi.fn() }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('WebGLRenderingContext', webgl ? class {} : undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  let visibility = hidden ? 'hidden' : 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility as DocumentVisibilityState)
  const observers: Observer[] = [], sizes: SizeObserver[] = []
  class Observer {
    target: Element | null = null
    disconnected = false
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    observe = vi.fn((target: Element) => { this.target = target })
    disconnect = vi.fn(() => { this.disconnected = true })
    emit(intersecting: boolean) { this.callback([{ target: this.target!, isIntersecting: intersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
  }
  class SizeObserver {
    disconnected = false
    constructor() { sizes.push(this) }
    observe = vi.fn()
    disconnect = vi.fn(() => { this.disconnected = true })
  }
  vi.stubGlobal('IntersectionObserver', observe ? Observer : undefined)
  vi.stubGlobal('ResizeObserver', SizeObserver)
  return {
    observers, sizes, listeners,
    intersect(target: Element, value: boolean) { act(() => observers.filter(o => !o.disconnected && o.target === target).forEach(o => o.emit(value))) },
    visibility(value: boolean) { act(() => { visibility = value ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')) }) },
    reduced(value: boolean) { act(() => { media.matches = value; listeners.forEach(listener => listener()) }) },
  }
}

function root(container: HTMLElement) { return container.querySelector('[data-html-glass-card]')! }
function renderer() { return vi.mocked(HtmlGlassCanvas).mock.calls.at(-1)![0] }

beforeEach(() => {
  vi.mocked(HtmlGlassCanvas).mockImplementation(({ animate }) => <div data-testid="html-gpu-boundary" data-animate={animate}><div data-testid="mock-html-slot" /></div>)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('native HTML glass scene', () => {
  it('keeps fallback content accessible, defers hidden loading, waits for readiness and cleans observers/listeners', async () => {
    const activity = environment({ hidden: true })
    const add = vi.spyOn(document, 'addEventListener'), remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><HtmlGlassCard /></StrictMode>)
    const element = root(view.container)
    const input = screen.getByRole('textbox', { name: 'Scene research note' })
    expect(input).toBeVisible()
    expect(element).toHaveAttribute('data-html-state', 'pending')
    activity.intersect(element, true)
    expect(HtmlGlassCanvas).not.toHaveBeenCalled()
    activity.visibility(false)
    const canvas = await screen.findByTestId('html-gpu-boundary')
    expect(element).toHaveAttribute('data-html-state', 'loading')
    expect(canvas).toHaveAttribute('data-animate', 'false')
    act(() => renderer().onReady())
    expect(element).toHaveAttribute('data-html-state', 'loaded')
    expect(canvas).toHaveAttribute('data-animate', 'true')
    expect(screen.getAllByRole('textbox', { name: 'Scene research note' })).toHaveLength(1)
    const old = renderer(), count = vi.mocked(HtmlGlassCanvas).mock.calls.length
    view.unmount()
    expect(activity.observers.every(o => o.disconnected)).toBe(true)
    expect(activity.sizes.every(o => o.disconnected)).toBe(true)
    expect(activity.listeners.size).toBe(0)
    for (const [, listener] of add.mock.calls.filter(([name]) => name === 'visibilitychange')) expect(remove).toHaveBeenCalledWith('visibilitychange', listener)
    act(() => { activity.observers.forEach(o => o.emit(true)); old.onReady(); old.onUnavailable() })
    expect(HtmlGlassCanvas).toHaveBeenCalledTimes(count)
  })

  it('gates the same loaded scene by viewport, document, reduced motion and real form focus', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const view = render(<><HtmlGlassCard /><button>Outside</button></>)
    const element = root(view.container)
    activity.intersect(element, true)
    const canvas = await screen.findByTestId('html-gpu-boundary')
    act(() => renderer().onReady())
    expect(canvas).toHaveAttribute('data-animate', 'true')
    activity.intersect(element, false)
    expect(canvas).toHaveAttribute('data-animate', 'false')
    activity.intersect(element, true)
    activity.visibility(true)
    expect(canvas).toHaveAttribute('data-animate', 'false')
    activity.visibility(false)
    activity.reduced(true)
    expect(canvas).toHaveAttribute('data-animate', 'false')
    activity.reduced(false)
    expect(canvas).toHaveAttribute('data-animate', 'true')
    await user.type(screen.getByRole('textbox', { name: 'Scene research note' }), 'A focused note')
    expect(canvas).toHaveAttribute('data-animate', 'false')
    activity.reduced(true);activity.reduced(false)
    expect(canvas).toHaveAttribute('data-animate', 'false')
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(canvas).toHaveAttribute('data-animate', 'true')
    expect(screen.getByTestId('html-gpu-boundary')).toBe(canvas)
  })

  it('keeps the same portal host, draft, cursor and focus when a renderer fails after the host moves', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const view = render(<HtmlGlassCard />)
    const element = root(view.container)
    activity.intersect(element, true)
    await screen.findByTestId('html-gpu-boundary')
    const callbacks = renderer(), host = element.querySelector('[data-html-content-host]') as HTMLDivElement
    const input = screen.getByRole('textbox', { name: 'Scene research note' }) as HTMLTextAreaElement
    await user.type(input, 'A persistent research note')
    input.setSelectionRange(2, 9)
    act(() => moveHtmlHost(host, screen.getByTestId('mock-html-slot')))
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(2)
    act(() => callbacks.onReady())
    expect(element).toHaveAttribute('data-html-state', 'loaded')
    act(() => callbacks.onUnavailable())
    expect(element).toHaveAttribute('data-html-state', 'unavailable')
    expect(screen.queryByTestId('html-gpu-boundary')).not.toBeInTheDocument()
    expect(host.closest('[data-html-native-slot]')).toBeInTheDocument()
    expect(element.querySelector('[data-html-content-host]')).toBe(host)
    expect(screen.getByRole('textbox', { name: 'Scene research note' })).toBe(input)
    expect(input).toHaveValue('A persistent research note')
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(9)
    act(() => callbacks.onReady())
    expect(element).toHaveAttribute('data-html-state', 'unavailable')
    expect(element.querySelectorAll('[data-html-content-host]')).toHaveLength(1)
  })

  it('provides independent accessible native fallback fields without WebGL and updates error/height without losing a draft', async () => {
    environment({ webgl: false })
    const user = userEvent.setup()
    const view = render(<><HtmlGlassCard /><HtmlGlassCard /></>)
    const [first, second] = screen.getAllByRole('textbox', { name: 'Scene research note' })
    expect(first.id).not.toBe(second.id)
    await user.type(first, 'Available without a renderer')
    expect(second).toHaveValue('')
    view.rerender(<><HtmlGlassCard error inputHeight={120} /><HtmlGlassCard /></>)
    expect(first).toHaveAttribute('aria-invalid', 'true')
    expect(first.closest('[data-modal-input-state]')).toHaveAttribute('data-modal-input-state', 'error')
    expect(first.closest('[data-modal-input-state]')).toHaveStyle({ height: '120px' })
    expect(first).toHaveValue('Available without a renderer')
    expect(first).toHaveFocus()
    expect(HtmlGlassCanvas).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  it('contains a thrown Canvas failure without losing its native field', async () => {
    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(HtmlGlassCanvas).mockImplementation(() => { throw new Error('HTML glass HDR failed') })
    const user = userEvent.setup()
    const view = render(<HtmlGlassCard />)
    const input = screen.getByRole('textbox', { name: 'Scene research note' })
    await user.type(input, 'Draft before loading')
    activity.intersect(root(view.container), true)
    await waitFor(() => expect(root(view.container)).toHaveAttribute('data-html-state', 'unavailable'))
    expect(screen.getByRole('textbox', { name: 'Scene research note' })).toBe(input)
    expect(input).toHaveValue('Draft before loading')
    expect(input).toHaveFocus()
  })

  it('loads a stationary scene without IntersectionObserver when reduced motion is initially enabled', async () => {
    environment({ observe: false, reduced: true })
    const view = render(<HtmlGlassCard />)
    const canvas = await screen.findByTestId('html-gpu-boundary')
    act(() => renderer().onReady())
    expect(canvas).toHaveAttribute('data-animate', 'false')
    expect(root(view.container)).toHaveAttribute('data-html-state', 'loaded')
  })
})
