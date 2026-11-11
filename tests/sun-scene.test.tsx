import { Children, isValidElement, StrictMode, Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import SunScene from '../src/components/react three fibre/sunScene/SunScene'
import NewUserCard from '../src/components/cards/newUserCard/NewUserCard'

// Capture the real scene's renderer contract without mounting Three intrinsics.
// All scene preference logic and surrounding card controls remain real.
vi.mock('@react-three/fiber', () => ({ Canvas: vi.fn() }))
vi.mock('@react-three/drei', () => ({ Environment: () => null, OrbitControls: () => null }))

function motionPreferences(reducedMotion = false) {
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
  const reduced = query(reducedMotion)
  const coarse = query(false)
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('prefers-reduced-motion') ? reduced.media : coarse.media))
  return {
    reduced,
    coarse,
    change(matches: boolean) {
      act(() => {
        reduced.media.matches = matches
        reduced.listeners.forEach(callback => callback())
      })
    },
  }
}

function sceneActivity({ hidden = false, observe = true } = {}) {
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
    observers,
    intersect(target: Element, intersecting: boolean) {
      act(() => observers.filter(observer => observer.target === target && !observer.disconnected).forEach(observer => observer.emit(intersecting)))
    },
    visibility(hidden: boolean) {
      act(() => { visibility = hidden ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')) })
    },
  }
}

function configuredCanvas() { return vi.mocked(Canvas).mock.calls.at(-1)![0] }
function controlsEnabled() {
  return Children.toArray(configuredCanvas().children).filter(isValidElement)
    .find(child => child.type === OrbitControls)?.props as { enabled: boolean }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', undefined)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.mocked(Canvas).mockImplementation(({ frameloop, ref }) => <canvas ref={ref} data-testid="canvas-boundary" data-frameloop={frameloop} />)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Calendar4 source Sun scene', () => {
  it('constructs the direct source scene with the local sunset environment and original lighting/controls', () => {
    motionPreferences()
    vi.stubGlobal('IntersectionObserver', undefined)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    render(<SunScene />)

    expect(screen.getByTestId('canvas-boundary')).toBeInTheDocument()
    const configured = vi.mocked(Canvas).mock.calls.at(-1)![0]
    const children = Children.toArray(configured.children).filter(isValidElement)
    expect(configured.camera).toBeUndefined()
    expect(configured['aria-hidden']).toBe('true')
    expect(children.find(child => child.type === 'ambientLight')).toHaveProperty('props.intensity', 2)
    expect(children.find(child => child.type === OrbitControls)).toHaveProperty('props.enableZoom', false)
    expect(children.find(child => child.type === OrbitControls)).toHaveProperty('props.enabled', false)
    expect(configured.frameloop).toBe('demand')
    expect(children.find(child => child.type === Suspense)).toBeDefined()
    expect(children.find(child => child.type === Environment)).toHaveProperty('props.files', `${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`)
  })

  it.each([false, true])('uses the requested initial reduced-motion mode (%s) at the Canvas boundary', reduced => {
    motionPreferences(reduced)
    render(<SunScene />)
    expect(screen.getByTestId('canvas-boundary')).toHaveAttribute('data-frameloop', reduced ? 'demand' : 'always')
    expect(controlsEnabled().enabled).toBe(true)
  })

  it('observes the actual canvas and pauses offscreen, hidden, and reduced without replacing it', () => {
    const preference = motionPreferences()
    const activity = sceneActivity()
    render(<SunScene />)
    const canvas = screen.getByTestId('canvas-boundary')
    expect(canvas.tagName).toBe('CANVAS')
    expect(activity.observers[0].observe).toHaveBeenCalledWith(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(controlsEnabled().enabled).toBe(false)

    activity.intersect(canvas, true)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(controlsEnabled().enabled).toBe(true)
    activity.intersect(canvas, false)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(controlsEnabled().enabled).toBe(false)
    activity.intersect(canvas, true)
    activity.visibility(true)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(controlsEnabled().enabled).toBe(false)
    activity.visibility(false)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    preference.change(true)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    // Reduced motion stops automatic frames; deliberate visible dragging remains available.
    expect(controlsEnabled().enabled).toBe(true)
    preference.change(false)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
  })

  it('stays on demand in an initially hidden document without IntersectionObserver and resumes when shown', () => {
    motionPreferences()
    const activity = sceneActivity({ hidden: true, observe: false })
    render(<SunScene />)
    const canvas = screen.getByTestId('canvas-boundary')
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(controlsEnabled().enabled).toBe(false)
    activity.visibility(false)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(controlsEnabled().enabled).toBe(true)
  })

  it('disconnects observers and document listeners, ignoring stale deliveries after StrictMode unmount', () => {
    const preference = motionPreferences()
    const activity = sceneActivity()
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><SunScene /></StrictMode>)
    const canvas = screen.getByTestId('canvas-boundary')
    activity.intersect(canvas, true)
    view.unmount()
    expect(activity.observers.every(observer => observer.disconnected)).toBe(true)
    const subscriptions = add.mock.calls.filter(([name]) => name === 'visibilitychange')
    expect(subscriptions.length).toBeGreaterThan(0)
    subscriptions.forEach(([name, callback]) => expect(remove).toHaveBeenCalledWith(name, callback))
    expect(preference.reduced.listeners.size).toBe(0)
    expect(preference.coarse.listeners.size).toBe(0)
    const calls = vi.mocked(Canvas).mock.calls.length
    act(() => activity.observers.forEach(observer => observer.emit(true)))
    activity.visibility(false)
    expect(Canvas).toHaveBeenCalledTimes(calls)
  })

  it('updates Canvas motion mode without losing card content, focused output, or native controls and cleans listeners', async () => {
    const preference = motionPreferences()
    const activity = sceneActivity()
    const action = vi.fn()
    const user = userEvent.setup()
    const view = render(<NewUserCard headingId="source-scene-heading" title="Source scene card" controls={<button type="button" onClick={action}>Edit card</button>}><label>Output notes<textarea /></label></NewUserCard>)
    const badge = document.querySelector('[data-source-sun]')!
    activity.intersect(badge, true)
    let canvas = await screen.findByTestId('canvas-boundary')
    const card = screen.getByRole('region', { name: 'Source scene card' })
    activity.intersect(canvas, true)
    const field = screen.getByRole('textbox', { name: 'Output notes' })
    await user.type(field, 'Research draft')
    activity.intersect(canvas, false)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    activity.visibility(true)
    expect(screen.queryByTestId('canvas-boundary')).not.toBeInTheDocument()
    const retiredCanvas = canvas
    activity.visibility(false)
    canvas = await screen.findByTestId('canvas-boundary')
    expect(canvas).not.toBe(retiredCanvas)
    activity.intersect(canvas, true)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    preference.change(true)
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    preference.change(false)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(screen.getByRole('textbox', { name: 'Output notes' })).toBe(field)
    expect(screen.getByRole('region', { name: 'Source scene card' })).toBe(card)
    expect(field).toHaveValue('Research draft')
    expect(field).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Edit card' }))
    expect(action).toHaveBeenCalledOnce()

    view.unmount()
    expect(preference.reduced.listeners.size).toBe(0)
    expect(preference.coarse.listeners.size).toBe(0)
  })
})
