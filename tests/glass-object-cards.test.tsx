import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlassObjectGallery, GlassPanelCard, GlassTorusCard } from '../src/components/glass-objects/GlassObjectCards'
import GlassObjectCanvas from '../src/components/glass-objects/GlassObjectCanvas'

vi.mock('../src/components/glass-objects/GlassObjectCanvas', () => ({ default: vi.fn() }))

function environment({ reduced = false, coarse = false, hidden = false, webgl = true, observe = true } = {}) {
  function media(matches: boolean) {
    const listeners = new Set<() => void>()
    return {
      matches, listeners,
      addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)),
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
    observe = vi.fn((target: Element) => { this.target = target })
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
      act(() => { motion.matches = value; motion.listeners.forEach(listener => listener()) })
    },
    coarse(value: boolean) {
      act(() => { pointer.matches = value; pointer.listeners.forEach(listener => listener()) })
    },
  }
}

function latest() { return vi.mocked(GlassObjectCanvas).mock.calls.at(-1)![0] }
function card(container: HTMLElement) { return container.querySelector('[data-glass-object-state]')! }

beforeEach(() => {
  vi.mocked(GlassObjectCanvas).mockImplementation(({ spin, interactive }) => (
    <div data-testid="glass-object-gpu-boundary" data-spin={spin} data-interactive={interactive} />
  ))
})
afterEach(() => { vi.unstubAllGlobals() })

describe('isolated glass objects with native controls', () => {
  it('defers the GPU scene until visible in a visible document, then waits for the renderer before spinning', async () => {
    const activity = environment({ hidden: true })
    const view = render(<StrictMode><GlassTorusCard /></StrictMode>)
    const element = card(view.container)
    expect(element).toHaveAttribute('data-glass-object-state', 'pending')
    expect(GlassObjectCanvas).not.toHaveBeenCalled()
    activity.intersect(true)
    expect(GlassObjectCanvas).not.toHaveBeenCalled()
    activity.visibility(false)
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    expect(element).toHaveAttribute('data-glass-object-state', 'loading')
    expect(renderer).toHaveAttribute('data-spin', 'false')
    act(() => latest().onReady())
    expect(element).toHaveAttribute('data-glass-object-state', 'loaded')
    expect(renderer).toHaveAttribute('data-spin', 'true')
    expect(latest()).toMatchObject({ kind: 'torus', rotationAxis: 'y', rotationSpeed: 0.3 })
  })

  it('keeps the same controls and scene when changing object, forwarding axis, signed speed and material edits without lettering controls', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<GlassObjectGallery />)
    activity.intersect(true)
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    const axis = screen.getByRole('combobox', { name: 'Rotation axis' })
    await user.selectOptions(axis, 'z')
    fireEvent.change(screen.getByRole('slider', { name: /Rotation speed:/ }), { target: { value: '-0.45' } })
    for (const [label, value] of [
      ['Transmission', '0.72'], ['Thickness', '1.1'], ['Refraction index', '1.6'],
      ['Chromatic aberration', '0.07'], ['Roughness', '0.18'],
    ]) fireEvent.change(screen.getByRole('slider', { name: new RegExp(`^${label}:`) }), { target: { value } })
    expect(latest()).toMatchObject({
      kind: 'torus', rotationAxis: 'z', rotationSpeed: -0.45,
      settings: { transmission: 0.72, thickness: 1.1, ior: 1.6, chromaticAberration: 0.07, roughness: 0.18 },
    })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Glass object' }), 'panel')
    expect(latest()).toMatchObject({ kind: 'panel', rotationAxis: 'z', rotationSpeed: -0.45, settings: { transmission: 0.72 } })
    expect(screen.getByRole('combobox', { name: 'Rotation axis' })).toBe(axis)
    expect(axis).toHaveValue('z')
    expect(screen.getAllByTestId('glass-object-gpu-boundary')).toEqual([renderer])
    expect(screen.queryByLabelText('Lettering')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Text placement')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Glass lettering')).not.toBeInTheDocument()
    expect(localStorage.length).toBe(0)
  })

  it('stops for zero speed, editing, reduced motion, hidden/offscreen activity and the Spin control without replacing the scene', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<><GlassTorusCard /><button>Outside object</button></>)
    activity.intersect(true)
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    act(() => latest().onReady())
    expect(renderer).toHaveAttribute('data-spin', 'true')
    const speed = screen.getByRole('slider', { name: /Rotation speed:/ })
    fireEvent.change(speed, { target: { value: '0' } })
    expect(renderer).toHaveAttribute('data-spin', 'false')
    expect(latest().rotationSpeed).toBe(0)
    await user.click(screen.getByRole('combobox', { name: 'Rotation axis' }))
    fireEvent.change(speed, { target: { value: '0.3' } })
    expect(renderer).toHaveAttribute('data-spin', 'false')
    expect(renderer).toHaveAttribute('data-interactive', 'false')
    await user.click(screen.getByRole('button', { name: 'Outside object' }))
    expect(renderer).toHaveAttribute('data-spin', 'true')
    activity.intersect(false)
    expect(renderer).toHaveAttribute('data-spin', 'false')
    expect(renderer).toHaveAttribute('data-interactive', 'false')
    activity.intersect(true)
    activity.visibility(true)
    expect(renderer).toHaveAttribute('data-spin', 'false')
    activity.visibility(false)
    activity.reduced(true)
    expect(renderer).toHaveAttribute('data-spin', 'false')
    activity.reduced(false)
    expect(renderer).toHaveAttribute('data-spin', 'true')
    await user.click(screen.getByRole('checkbox', { name: 'Spin' }))
    await user.click(screen.getByRole('button', { name: 'Outside object' }))
    expect(renderer).toHaveAttribute('data-spin', 'false')
    expect(screen.getByTestId('glass-object-gpu-boundary')).toBe(renderer)
  })

  it('uses adaptive quality while keeping a manual choice across pointer changes', async () => {
    const activity = environment({ coarse: true })
    const user = userEvent.setup()
    render(<GlassPanelCard />)
    activity.intersect(true)
    await screen.findByTestId('glass-object-gpu-boundary')
    expect(latest()).toMatchObject({ kind: 'panel', coarse: true, high: false, settings: { samples: 4, resolution: 256, backside: false } })
    activity.coarse(false)
    expect(latest()).toMatchObject({ coarse: false, high: true, settings: { samples: 6, resolution: 512, backside: true } })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Quality' }), 'balanced')
    activity.coarse(true)
    activity.coarse(false)
    expect(latest().high).toBe(false)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Quality' }), 'high')
    expect(latest().high).toBe(true)
  })

  it('forwards an instance lighting multiplier without resetting controls, material state, focus or the renderer', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const material = { color: '#cdd2d9', thickness: 0.41 }
    const view = render(<GlassTorusCard initialMaterial={material} />)
    activity.intersect(true)
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    expect(latest().lightingIntensity).toBe(1)
    const settings = latest().settings
    const axis = screen.getByRole('combobox', { name: 'Rotation axis' })
    await user.selectOptions(axis, 'z')
    view.rerender(<GlassTorusCard initialMaterial={material} lightingIntensity={1.25} />)
    expect(latest()).toMatchObject({ lightingIntensity: 1.25, rotationAxis: 'z', settings: { color: '#cdd2d9', thickness: 0.41 } })
    expect(latest().settings).toBe(settings)
    expect(screen.getByTestId('glass-object-gpu-boundary')).toBe(renderer)
    expect(screen.getByRole('combobox', { name: 'Rotation axis' })).toBe(axis)
    expect(axis).toHaveFocus()
    expect(material).toEqual({ color: '#cdd2d9', thickness: 0.41 })
  })

  it('changes the backdrop without replacing a loaded renderer, resetting edited optics or losing native control focus', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const view = render(<GlassPanelCard />)
    activity.intersect(true)
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    act(() => latest().onReady())
    expect(latest().backdrop).toBe('dark')
    const axis = screen.getByRole('combobox', { name: 'Rotation axis' })
    await user.selectOptions(axis, 'x')
    fireEvent.change(screen.getByRole('slider', { name: /Thickness:/ }), { target: { value: '0.55' } })
    const editedSettings = latest().settings

    view.rerender(<GlassPanelCard backdrop="neutral" />)

    expect(latest()).toMatchObject({ backdrop: 'neutral', rotationAxis: 'x', settings: { thickness: 0.55 } })
    expect(latest().settings).toBe(editedSettings)
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'loaded')
    expect(screen.getByTestId('glass-object-gpu-boundary')).toBe(renderer)
    expect(screen.getByRole('combobox', { name: 'Rotation axis' })).toBe(axis)
    expect(axis).toHaveFocus()
    view.rerender(<GlassPanelCard backdrop="dark" />)
    expect(latest().backdrop).toBe('dark')
    expect(latest().settings).toBe(editedSettings)
    expect(screen.getByTestId('glass-object-gpu-boundary')).toBe(renderer)
    expect(axis).toHaveFocus()
  })

  it('retains native values/focus through context and renderer failures, and rejects callbacks from previous attempts', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const view = render(<GlassTorusCard />)
    activity.intersect(true)
    await screen.findByTestId('glass-object-gpu-boundary')
    const old = latest()
    const axis = screen.getByRole('combobox', { name: 'Rotation axis' })
    await user.selectOptions(axis, 'x')
    act(() => old.onUnavailable('context'))
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'unavailable')
    expect(axis).toHaveFocus()
    expect(axis).toHaveValue('x')
    act(() => old.onReady())
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'unavailable')
    await user.click(screen.getByRole('button', { name: 'Retry 3D preview' }))
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    const current = latest()
    act(() => { old.onReady(); old.onUnavailable() })
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'loading')
    act(() => current.onReady())
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'loaded')
    expect(screen.getByRole('combobox', { name: 'Rotation axis' })).toBe(axis)
    expect(screen.getByTestId('glass-object-gpu-boundary')).toBe(renderer)
    act(() => current.onUnavailable())
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'unavailable')
    await user.click(screen.getByRole('button', { name: 'Retry 3D preview' }))
    await screen.findByTestId('glass-object-gpu-boundary')
    expect(latest().rotationAxis).toBe('x')
  })

  it('retains caller-provided native content and initial options without WebGL, and contains a renderer exception locally', async () => {
    environment({ webgl: false })
    const material = { ior: 1.6 }
    const action = vi.fn()
    const user = userEvent.setup()
    const view = render(<GlassPanelCard title="Custom native panel" initialSpin={false} initialRotationAxis="x" initialRotationSpeed={-0.5} initialMaterial={material}><button onClick={action}>Use this card</button></GlassPanelCard>)
    expect(card(view.container)).toHaveAttribute('data-glass-object-state', 'unavailable')
    expect(GlassObjectCanvas).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Custom native panel' })).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Spin' })).not.toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Rotation axis' })).toHaveValue('x')
    expect(screen.getByRole('slider', { name: /Rotation speed:/ })).toHaveValue('-0.5')
    fireEvent.change(screen.getByRole('slider', { name: /Refraction index:/ }), { target: { value: '1.4' } })
    expect(material).toEqual({ ior: 1.6 })
    await user.click(screen.getByRole('button', { name: 'Use this card' }))
    expect(action).toHaveBeenCalledOnce()
    view.unmount()

    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(GlassObjectCanvas).mockImplementation(() => { throw new Error('Renderer unavailable') })
    const failed = render(<GlassTorusCard />)
    activity.intersect(true)
    await waitFor(() => expect(card(failed.container)).toHaveAttribute('data-glass-object-state', 'unavailable'))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rotation axis' }), 'z')
    expect(screen.getByRole('combobox', { name: 'Rotation axis' })).toHaveValue('z')
    expect(localStorage.length).toBe(0)
  })

  it('cleans observer/media/document subscriptions under StrictMode, ignores stale events and works without IntersectionObserver', async () => {
    const activity = environment()
    const added = vi.spyOn(document, 'addEventListener'), removed = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><GlassTorusCard /></StrictMode>)
    activity.intersect(true)
    await screen.findByTestId('glass-object-gpu-boundary')
    const observer = activity.observers.at(-1)!
    const listener = added.mock.calls.filter(([name]) => name === 'visibilitychange').at(-1)![1]
    const callback = latest()
    view.unmount()
    expect(activity.observers.every(value => value.disconnected)).toBe(true)
    expect(activity.motion.listeners.size).toBe(0)
    expect(activity.pointer.listeners.size).toBe(0)
    expect(removed).toHaveBeenCalledWith('visibilitychange', listener)
    const calls = vi.mocked(GlassObjectCanvas).mock.calls.length
    act(() => { observer.emit(true); callback.onReady(); callback.onUnavailable() })
    expect(GlassObjectCanvas).toHaveBeenCalledTimes(calls)
    environment({ observe: false, reduced: true })
    render(<GlassPanelCard />)
    const renderer = await screen.findByTestId('glass-object-gpu-boundary')
    act(() => latest().onReady())
    expect(renderer).toHaveAttribute('data-spin', 'false')
  })
})
