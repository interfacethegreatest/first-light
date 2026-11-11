import { StrictMode, createRef, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlassPanel3D from '../src/components/glass-panel-3d/GlassPanel3D'
import GlassPanelCanvas from '../src/components/glass-panel-3d/GlassPanelCanvas'
import { useGlassPanelMount } from '../src/components/glass-panel-3d/useGlassPanelMount'

vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas', () => ({ default: vi.fn() }))

function webgl(available = true) {
  vi.stubGlobal('WebGLRenderingContext', available ? class {} : undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
}

function latestCanvas() { return vi.mocked(GlassPanelCanvas).mock.calls.at(-1)![0] }
function panel(container: HTMLElement) { return container.querySelector('[data-glass-panel]')! }
function layer(container: HTMLElement) { return container.querySelector('[data-glass-layer]')! }

beforeEach(() => {
  webgl()
  vi.mocked(GlassPanelCanvas).mockImplementation(() => <div data-testid="glass-gpu-boundary" />)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('public glass panel mounting hook', () => {
  it('uses independent initial state and stable, idempotent actions under StrictMode', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    const first = renderHook(() => useGlassPanelMount(false), { wrapper })
    const second = renderHook(() => useGlassPanelMount(), { wrapper })
    const { mount, unmount, toggle } = first.result.current
    expect(first.result.current.isMounted).toBe(false)
    expect(second.result.current.isMounted).toBe(true)
    act(() => { mount(); mount() })
    expect(first.result.current.isMounted).toBe(true)
    act(() => { unmount(); unmount() })
    expect(first.result.current.isMounted).toBe(false)
    act(() => toggle())
    expect(first.result.current.isMounted).toBe(true)
    act(() => toggle())
    expect(first.result.current.isMounted).toBe(false)
    expect(second.result.current.isMounted).toBe(true)
    expect(first.result.current.mount).toBe(mount)
    expect(first.result.current.unmount).toBe(unmount)
    expect(first.result.current.toggle).toBe(toggle)
  })
})

describe('reusable native glass panel', () => {
  it('defers offscreen and hidden GPU work while native HTML is immediately usable', async () => {
    let visibility: DocumentVisibilityState = 'hidden'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    let callback!: IntersectionObserverCallback
    let target!: Element
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(next: IntersectionObserverCallback) { callback = next }
      observe(element: Element) { target = element }
      disconnect = disconnect
    })
    const view = render(<GlassPanel3D><label>Immediate draft<input defaultValue="Keep me" /></label></GlassPanel3D>)
    const input = screen.getByRole('textbox', { name: 'Immediate draft' })
    input.focus()
    expect(GlassPanelCanvas).not.toHaveBeenCalled()
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'pending')
    act(() => callback([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
    expect(GlassPanelCanvas).not.toHaveBeenCalled()
    act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')) })
    await screen.findByTestId('glass-gpu-boundary')
    expect(disconnect).toHaveBeenCalledOnce()
    expect(screen.getByRole('textbox', { name: 'Immediate draft' })).toBe(input)
    expect(input).toHaveValue('Keep me')
    expect(input).toHaveFocus()
  })

  it('disconnects pending activation on unmount and ignores late observer delivery', () => {
    let callback!: IntersectionObserverCallback
    let target!: Element
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(next: IntersectionObserverCallback) { callback = next }
      observe(element: Element) { target = element }
      disconnect = disconnect
    })
    const view = render(<GlassPanel3D>Native content</GlassPanel3D>)
    view.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
    act(() => callback([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
    expect(GlassPanelCanvas).not.toHaveBeenCalled()
  })

  it('forwards native div props, ref, classes and events without replacing its content', () => {
    webgl(false)
    const ref = createRef<HTMLDivElement>()
    const click = vi.fn()
    render(<GlassPanel3D ref={ref} role="region" aria-label="Research surface" id="research-surface" tabIndex={0} className="custom-panel" contentClassName="custom-content" data-owner="caller" style={{ maxWidth: 500 }} onClick={click}><h2>Native research content</h2></GlassPanel3D>)
    const region = screen.getByRole('region', { name: 'Research surface' })
    expect(region.tagName).toBe('DIV')
    expect(ref.current).toBe(region)
    expect(region).toHaveAttribute('id', 'research-surface')
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('data-owner', 'caller')
    expect(region).toHaveClass('custom-panel')
    expect(region).toHaveStyle({ maxWidth: '500px' })
    expect(screen.getByRole('heading', { name: 'Native research content' }).parentElement).toHaveClass('custom-content')
    fireEvent.click(region)
    expect(click).toHaveBeenCalledOnce()
  })

  it('toggles only the GPU layer while preserving child nodes, native draft and focused input', async () => {
    let controls!: ReturnType<typeof useGlassPanelMount>
    function Harness() {
      controls = useGlassPanelMount()
      return <GlassPanel3D mounted={controls.isMounted}><label>Research draft<input defaultValue="Initial idea" /></label></GlassPanel3D>
    }
    const user = userEvent.setup()
    const view = render(<StrictMode><Harness /></StrictMode>)
    const firstCanvas = await screen.findByTestId('glass-gpu-boundary')
    const content = screen.getByRole('textbox', { name: 'Research draft' }).parentElement!.parentElement
    const input = screen.getByRole('textbox', { name: 'Research draft' })
    await user.clear(input)
    await user.type(input, 'A draft that survives GPU changes')
    act(() => latestCanvas().onReady?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loaded')
    expect(panel(view.container)).toHaveAttribute('data-glass-mounted', 'true')

    act(() => controls.unmount())
    expect(view.container.querySelector('[data-glass-layer]')).not.toBeInTheDocument()
    expect(screen.queryByTestId('glass-gpu-boundary')).not.toBeInTheDocument()
    expect(panel(view.container)).toHaveAttribute('data-glass-mounted', 'false')
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toBe(input)
    expect(input).toHaveValue('A draft that survives GPU changes')
    expect(input).toHaveFocus()

    act(() => controls.mount())
    const nextCanvas = await screen.findByTestId('glass-gpu-boundary')
    expect(nextCanvas).not.toBe(firstCanvas)
    expect(input.parentElement!.parentElement).toBe(content)
    expect(input).toHaveValue('A draft that survives GPU changes')
    expect(input).toHaveFocus()
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loading')
    act(() => latestCanvas().onReady?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loaded')
  })

  it('keeps an initially disabled layer absent and enables it without remounting native children', async () => {
    const user = userEvent.setup()
    const view = render(<GlassPanel3D mounted={false}><label>Draft without a GPU<input /></label></GlassPanel3D>)
    const input = screen.getByRole('textbox', { name: 'Draft without a GPU' })
    await user.type(input, 'HTML comes first')
    expect(view.container.querySelector('[data-glass-layer]')).not.toBeInTheDocument()
    expect(GlassPanelCanvas).not.toHaveBeenCalled()
    view.rerender(<GlassPanel3D mounted><label>Draft without a GPU<input /></label></GlassPanel3D>)
    await screen.findByTestId('glass-gpu-boundary')
    expect(screen.getByRole('textbox', { name: 'Draft without a GPU' })).toBe(input)
    expect(input).toHaveValue('HTML comes first')
    expect(input).toHaveFocus()
    expect(layer(view.container)).toHaveAttribute('aria-hidden', 'true')
  })

  it('rejects callbacks from old mounts and permits an explicit fresh mount after failure', async () => {
    const content = <label>Stable draft<input defaultValue="Keep this" /></label>
    const view = render(<GlassPanel3D>{content}</GlassPanel3D>)
    await screen.findByTestId('glass-gpu-boundary')
    const oldCallbacks = latestCanvas()
    const input = screen.getByRole('textbox', { name: 'Stable draft' })
    view.rerender(<GlassPanel3D mounted={false}>{content}</GlassPanel3D>)
    view.rerender(<GlassPanel3D>{content}</GlassPanel3D>)
    const secondCanvas = await screen.findByTestId('glass-gpu-boundary')
    const currentCallbacks = latestCanvas()
    act(() => { oldCallbacks.onReady?.(); oldCallbacks.onUnavailable?.() })
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loading')
    expect(screen.getByTestId('glass-gpu-boundary')).toBe(secondCanvas)
    act(() => currentCallbacks.onReady?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loaded')
    act(() => oldCallbacks.onUnavailable?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loaded')
    act(() => currentCallbacks.onUnavailable?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'unavailable')
    expect(screen.queryByTestId('glass-gpu-boundary')).not.toBeInTheDocument()
    act(() => currentCallbacks.onReady?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'unavailable')
    expect(screen.getByRole('textbox', { name: 'Stable draft' })).toBe(input)
    expect(input).toHaveValue('Keep this')
    view.rerender(<GlassPanel3D mounted={false}>{content}</GlassPanel3D>)
    view.rerender(<GlassPanel3D>{content}</GlassPanel3D>)
    await screen.findByTestId('glass-gpu-boundary')
    const freshCallbacks = latestCanvas()
    act(() => freshCallbacks.onReady?.())
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'loaded')
    view.unmount()
    act(() => { freshCallbacks.onReady?.(); freshCallbacks.onUnavailable?.() })
    expect(screen.queryByTestId('glass-gpu-boundary')).not.toBeInTheDocument()
  })

  it('keeps accessible native form controls usable without WebGL and performs no storage writes', async () => {
    webgl(false)
    const submit = vi.fn()
    const user = userEvent.setup()
    const view = render(<form onSubmit={event => { event.preventDefault(); submit() }}><GlassPanel3D><label>Research draft<input required /></label><button type="submit">Save draft</button></GlassPanel3D></form>)
    expect(layer(view.container)).toHaveAttribute('data-glass-state', 'unavailable')
    expect(GlassPanelCanvas).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Research draft' }), 'Usable HTML fallback')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(submit).toHaveBeenCalledOnce()
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toHaveValue('Usable HTML fallback')
    expect(localStorage.length).toBe(0)
  })

  it('contains a renderer error locally without removing native content or actions', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(GlassPanelCanvas).mockImplementation(() => { throw new Error('Glass HDR unavailable') })
    const action = vi.fn()
    const user = userEvent.setup()
    const view = render(<GlassPanel3D><h2>Research remains usable</h2><button onClick={action}>Continue research</button></GlassPanel3D>)
    await waitFor(() => expect(layer(view.container)).toHaveAttribute('data-glass-state', 'unavailable'))
    expect(screen.getByRole('heading', { name: 'Research remains usable' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continue research' }))
    expect(action).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('glass-gpu-boundary')).not.toBeInTheDocument()
  })
})
