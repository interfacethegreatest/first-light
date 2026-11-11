import { Children, StrictMode, Suspense, isValidElement, type Ref } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Canvas } from '@react-three/fiber'
import MoonMark from '../src/components/misc/MoonMark/MoonMark'
import MoonMarkCanvas from '../src/components/misc/MoonMark/MoonMarkCanvas'
import { moonMarkTemplate } from '../src/components/misc/MoonMark/moonMarkTemplate'
import App from '../src/App'

vi.mock('../src/components/misc/MoonMark/MoonMarkCanvas', () => ({ default: vi.fn() }))
vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas', () => ({ default: () => null }))
vi.mock('@react-three/fiber', () => ({ Canvas: vi.fn() }))
vi.mock('@react-three/drei', () => ({ useGLTF: Object.assign(vi.fn(), { preload: vi.fn() }) }))

function environment({ reduced = false, webgl = true, hidden = false, observe = true } = {}) {
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
  const motion = query(reduced), coarse = query(false)
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('reduced-motion') ? motion.media : coarse.media))
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
    observers, motion, coarse,
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

function mark(container: HTMLElement) { return container.querySelector('[data-moon-mark]')! }
function latestRenderer() { return vi.mocked(MoonMarkCanvas).mock.calls.at(-1)![0] }
function currentModelProps() {
  const configured = vi.mocked(Canvas).mock.calls.at(-1)![0]
  const suspense = Children.toArray(configured.children).find(child => isValidElement(child) && child.type === Suspense)
  if (!isValidElement<{ children: { props: { animate?: boolean; rotationAxis?: 'x' | 'y' | 'z'; rotationSpeed?: number; onReady: () => void } } }>(suspense)) {
    throw new Error('Missing Moon model suspense boundary')
  }
  return suspense.props.children.props
}

beforeEach(() => {
  vi.mocked(MoonMarkCanvas).mockImplementation(({ animate }) => <div data-testid="moon-gpu-boundary" data-animate={Boolean(animate)} />)
  vi.mocked(Canvas).mockImplementation(props => (
    <canvas ref={(props as { ref?: Ref<HTMLCanvasElement> }).ref} data-testid="canvas-boundary" data-frameloop={props.frameloop} />
  ))
})

afterEach(() => { vi.unstubAllGlobals() })

describe('reusable Moon scene', () => {
  it('waits for first visibility and displays only the stationary scene with no vector while loading', async () => {
    const activity = environment()
    const view = render(<StrictMode><MoonMark className="reusable-moon" /></StrictMode>)
    const element = mark(view.container)
    expect(element).toHaveAttribute('aria-hidden', 'true')
    expect(element).toHaveClass('reusable-moon')
    expect(element).toHaveAttribute('data-moon-state', 'pending')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
    expect(MoonMarkCanvas).not.toHaveBeenCalled()

    activity.intersect(element, true)
    const renderer = await screen.findByTestId('moon-gpu-boundary')
    expect(element).toHaveAttribute('data-moon-state', 'loading')
    expect(renderer).toHaveAttribute('data-animate', 'false')
    expect(element.querySelector('svg')).not.toBeInTheDocument()
    act(() => latestRenderer().onReady?.())
    expect(element).toHaveAttribute('data-moon-state', 'loaded')
    expect(element.querySelector('[data-moon-fallback]')).not.toBeInTheDocument()
    expect(screen.getByTestId('moon-gpu-boundary')).toBe(renderer)
    view.unmount()
    expect(activity.observers.every(observer => observer.disconnected)).toBe(true)
    expect(activity.motion.listeners.size).toBe(0)
    expect(activity.coarse.listeners.size).toBe(0)
  })

  it('pauses opted-in animation offscreen, hidden, reduced, or disabled without replacing its loaded scene', async () => {
    const activity = environment()
    const view = render(<MoonMark animate />)
    const element = mark(view.container)
    activity.intersect(element, true)
    const renderer = await screen.findByTestId('moon-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    expect(renderer).toHaveAttribute('data-animate', 'true')
    activity.intersect(element, false)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.intersect(element, true)
    activity.visibility(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.visibility(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    activity.reduced(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.reduced(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    view.rerender(<MoonMark animate={false} />)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    expect(screen.getByTestId('moon-gpu-boundary')).toBe(renderer)
    expect(element).toHaveAttribute('data-moon-state', 'loaded')
  })

  it('defers first loading while the document is hidden and removes document subscriptions on unmount', async () => {
    const activity = environment({ hidden: true })
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<MoonMark animate />)
    const element = mark(view.container)
    activity.intersect(element, true)
    expect(MoonMarkCanvas).not.toHaveBeenCalled()
    activity.visibility(false)
    await screen.findByTestId('moon-gpu-boundary')
    const listener = add.mock.calls.find(([name]) => name === 'visibilitychange')![1]
    const observer = activity.observers.at(-1)!
    view.unmount()
    expect(remove).toHaveBeenCalledWith('visibilitychange', listener)
    expect(observer.disconnect).toHaveBeenCalledOnce()
    // A queued observer delivery after cleanup cannot remount the renderer.
    const calls = vi.mocked(MoonMarkCanvas).mock.calls.length
    act(() => observer.emit(true))
    expect(MoonMarkCanvas).toHaveBeenCalledTimes(calls)
  })

  it('leaves the decorative region empty without WebGL and keeps native sibling controls working', async () => {
    const activity = environment({ webgl: false })
    const action = vi.fn()
    const user = userEvent.setup()
    const view = render(<><MoonMark /><button onClick={action}>Workspace action</button></>)
    const element = mark(view.container)
    activity.intersect(element, true)
    expect(element).toHaveAttribute('data-moon-state', 'unavailable')
    expect(element.querySelector('svg, canvas')).not.toBeInTheDocument()
    expect(MoonMarkCanvas).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Workspace action' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('still renders when IntersectionObserver is unavailable and honors the initial reduced preference', async () => {
    environment({ observe: false, reduced: true })
    const view = render(<MoonMark animate />)
    expect(await screen.findByTestId('moon-gpu-boundary')).toHaveAttribute('data-animate', 'false')
    expect(mark(view.container)).toHaveAttribute('data-moon-animate', 'false')
  })

  it('contains a renderer error locally and preserves surrounding actions without substituting an icon', async () => {
    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(MoonMarkCanvas).mockImplementation(() => { throw new Error('Moon asset unavailable') })
    const action = vi.fn()
    const user = userEvent.setup()
    const view = render(<><MoonMark /><button onClick={action}>Continue research</button></>)
    const element = mark(view.container)
    activity.intersect(element, true)
    await waitFor(() => expect(element).toHaveAttribute('data-moon-state', 'unavailable'))
    expect(element.querySelector('svg, canvas')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue research' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('creates independent scene objects and removes a failed renderer without introducing an icon', async () => {
    const activity = environment()
    const view = render(<>{moonMarkTemplate.render({ size: 24 })}{moonMarkTemplate.render({ size: 48 })}</>)
    const [first, second] = [...view.container.querySelectorAll('[data-moon-mark]')]
    activity.intersect(first, true)
    await screen.findByTestId('moon-gpu-boundary')
    act(() => latestRenderer().onReady?.())
    expect(first).toHaveAttribute('data-moon-state', 'loaded')
    expect(second).toHaveAttribute('data-moon-state', 'pending')
    expect(second.querySelector('svg, canvas')).not.toBeInTheDocument()
    expect((first as HTMLElement).style.getPropertyValue('--moon-mark-size')).toBe('24px')
    expect((second as HTMLElement).style.getPropertyValue('--moon-mark-size')).toBe('48px')
    act(() => latestRenderer().onUnavailable?.())
    expect(first).toHaveAttribute('data-moon-state', 'unavailable')
    expect(first.querySelector('svg, canvas')).not.toBeInTheDocument()
    expect(second).toHaveAttribute('data-moon-state', 'pending')
  })

  it('opts the actual header into gated rotation while keeping its home anchor, Tab order, and unrelated form draft', async () => {
    const activity = environment()
    const user = userEvent.setup()
    render(<App />)
    const home = screen.getByRole('link', { name: 'First Light home' })
    expect(home).toHaveAttribute('href', '#top')
    expect(home.querySelectorAll('[data-moon-mark]')).toHaveLength(1)
    expect(home.querySelector('[data-moon-mark] svg')).not.toBeInTheDocument()
    const element = home.querySelector('[data-moon-mark]')!
    activity.intersect(element, true)
    const renderer = await screen.findByTestId('moon-gpu-boundary')
    expect(renderer).toHaveAttribute('data-animate', 'false')
    act(() => latestRenderer().onReady?.())
    expect(latestRenderer()).toMatchObject({ animate: true, rotationAxis: 'y', rotationSpeed: -0.12 })
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to workspace' })).toHaveFocus()
    await user.tab()
    expect(home).toHaveFocus()
    activity.intersect(element, false)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.intersect(element, true)
    activity.visibility(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.visibility(false)
    activity.reduced(true)
    expect(renderer).toHaveAttribute('data-animate', 'false')
    activity.reduced(false)
    expect(renderer).toHaveAttribute('data-animate', 'true')
    expect(home).toHaveFocus()
    expect(screen.getByTestId('moon-gpu-boundary')).toBe(renderer)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Export workspace' })).toHaveFocus()
    const title = screen.getByRole('textbox', { name: 'Source title' })
    await user.type(title, 'A native research draft')
    expect(title).toHaveValue('A native research draft')
    expect(home).toHaveAccessibleName('First Light home')
    expect(localStorage.length).toBe(0)
  })
})

describe('actual Moon Canvas lifecycle at the GPU boundary', () => {
  it('forwards changing axis and speed from the reusable mark through the actual Canvas to the model, keeping zero speed idle', async () => {
    const { default: ActualMoonCanvas } = await vi.importActual<typeof import('../src/components/misc/MoonMark/MoonMarkCanvas')>('../src/components/misc/MoonMark/MoonMarkCanvas')
    vi.mocked(MoonMarkCanvas).mockImplementation(ActualMoonCanvas)
    const activity = environment()
    const view = render(<MoonMark animate rotationAxis="x" rotationSpeed={0.3} />)
    const element = mark(view.container)
    activity.intersect(element, true)
    const canvas = await screen.findByTestId('canvas-boundary')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    act(() => currentModelProps().onReady())
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(currentModelProps()).toMatchObject({ animate: true, rotationAxis: 'x', rotationSpeed: 0.3 })

    view.rerender(<MoonMark animate rotationAxis="z" rotationSpeed={-0.6} />)
    expect(currentModelProps()).toMatchObject({ animate: true, rotationAxis: 'z', rotationSpeed: -0.6 })
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)

    view.rerender(<MoonMark animate rotationAxis="z" rotationSpeed={0} />)
    expect(element).toHaveAttribute('data-moon-animate', 'false')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(currentModelProps()).toMatchObject({ animate: false, rotationAxis: 'z', rotationSpeed: 0 })

    view.rerender(<MoonMark animate={false} rotationAxis="y" rotationSpeed={-0.12} />)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(currentModelProps()).toMatchObject({ animate: false, rotationAxis: 'y', rotationSpeed: -0.12 })
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
  })

  it('uses demand while idle, retains its Canvas, reports context loss once, and suppresses stale readiness', async () => {
    const { default: ActualMoonCanvas } = await vi.importActual<typeof import('../src/components/misc/MoonMark/MoonMarkCanvas')>('../src/components/misc/MoonMark/MoonMarkCanvas')
    const firstReady = vi.fn(), latestReady = vi.fn(), unavailable = vi.fn()
    const view = render(<ActualMoonCanvas onReady={firstReady} onUnavailable={unavailable} />)
    const canvas = screen.getByTestId('canvas-boundary')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    const readyFromMesh = currentModelProps().onReady
    expect(firstReady).not.toHaveBeenCalled()
    view.rerender(<ActualMoonCanvas animate onReady={latestReady} onUnavailable={unavailable} />)
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    act(() => readyFromMesh())
    expect(firstReady).not.toHaveBeenCalled()
    expect(latestReady).toHaveBeenCalledOnce()
    view.rerender(<ActualMoonCanvas animate rotationSpeed={0} onReady={latestReady} onUnavailable={unavailable} />)
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(currentModelProps()).toMatchObject({ animate: false, rotationSpeed: 0 })
    const remove = vi.spyOn(canvas, 'removeEventListener')
    const lost = new Event('webglcontextlost', { cancelable: true })
    fireEvent(canvas, lost)
    expect(lost.defaultPrevented).toBe(true)
    expect(unavailable).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('canvas-boundary')).not.toBeInTheDocument()
    expect(remove).toHaveBeenCalledWith('webglcontextlost', expect.any(Function))
    act(() => readyFromMesh())
    fireEvent(canvas, new Event('webglcontextlost'))
    expect(latestReady).toHaveBeenCalledOnce()
    expect(unavailable).toHaveBeenCalledOnce()
    view.unmount()
  })
})
