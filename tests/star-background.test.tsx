import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Children, Suspense, isValidElement } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useFrame, type RootState } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Points } from 'three'
import Scene from '../src/components/backgrounds/starsBackground/Scene'
import StarBackground from '../src/components/backgrounds/starsBackground/StarBackground'

vi.mock('../src/components/backgrounds/starsBackground/Scene', () => ({
  default: vi.fn(),
}))
vi.mock('@react-three/fiber', () => ({ Canvas: vi.fn(), useFrame: vi.fn() }))
vi.mock('@react-three/drei', () => ({ Stars: vi.fn() }))

function deferredScheduler() {
  let next = 0
  const frames = new Map<number, FrameRequestCallback>()
  const idle = new Map<number, IdleRequestCallback>()
  const requestIdle = vi.fn((callback: IdleRequestCallback, _options?: IdleRequestOptions) => {
    idle.set(++next, callback);return next
  })
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++next, callback);return next }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  vi.stubGlobal('requestIdleCallback', requestIdle)
  vi.stubGlobal('cancelIdleCallback', vi.fn((id: number) => idle.delete(id)))
  const paint = () => act(() => {
    const pending = [...frames.values()];frames.clear()
    pending.forEach(callback => callback(0))
  })
  return {
    frames, idle, requestIdle, paint,
    async start() {
      paint();paint()
      await act(async () => {
        const pending = [...idle.values()];idle.clear()
        pending.forEach(callback => callback({ didTimeout: false, timeRemaining: () => 20 }))
      })
    },
  }
}

function visibility(initial = 'visible') {
  let state = initial
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state as DocumentVisibilityState)
  return (next: string) => act(() => {
    state = next;document.dispatchEvent(new Event('visibilitychange'))
  })
}

let deferred: ReturnType<typeof deferredScheduler>

function mockMotionPreference(initial: boolean) {
  const listeners = new Set<() => void>()
  const media = {
    matches: initial,
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
  }
  const matchMedia = vi.fn(() => media)
  vi.stubGlobal('matchMedia', matchMedia)

  return {
    media,
    matchMedia,
    listeners,
    change(matches: boolean) {
      act(() => {
        media.matches = matches
        for (const listener of listeners) listener()
      })
    },
  }
}

beforeEach(() => {
  deferred = deferredScheduler()
  visibility()
  vi.mocked(Scene).mockImplementation(({ reducedMotion, pageVisible, editing }) => (
    <div data-testid="mock-star-scene" data-reduced-motion={String(reducedMotion)} data-page-visible={pageVisible} data-editing={editing} />
  ))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('decorative star background', () => {
  it('leaves native actions available before requesting GPU work after two paints and idle time', async () => {
    mockMotionPreference(false)
    const action = vi.fn()
    render(<><StarBackground /><main><button onClick={action}>Workspace action</button></main></>)

    const background = screen.getByTestId('star-background')
    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(background).not.toHaveAttribute('tabindex')
    expect(background).toHaveStyle({ position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none' })
    expect(Scene).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Workspace action' }))
    expect(action).toHaveBeenCalledOnce()
    deferred.paint()
    expect(deferred.requestIdle).not.toHaveBeenCalled()
    deferred.paint()
    expect(deferred.requestIdle).toHaveBeenCalledWith(expect.any(Function), { timeout: 1500 })
    expect(Scene).not.toHaveBeenCalled()
    await deferred.start()
    expect(screen.getByTestId('mock-star-scene')).toBeInTheDocument()
  })

  it.each([false, true])('passes the initial reduced-motion preference (%s) to the renderer', async reducedMotion => {
    const preference = mockMotionPreference(reducedMotion)
    render(<StarBackground />)
    await deferred.start()

    expect(preference.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(screen.getByTestId('mock-star-scene')).toHaveAttribute('data-reduced-motion', String(reducedMotion))
  })

  it('updates the renderer when reduced motion changes and removes the subscription on unmount', async () => {
    const preference = mockMotionPreference(false)
    const view = render(<StarBackground />)
    await deferred.start()
    expect(preference.listeners.size).toBe(1)

    preference.change(true)
    expect(screen.getByTestId('mock-star-scene')).toHaveAttribute('data-reduced-motion', 'true')
    preference.change(false)
    expect(screen.getByTestId('mock-star-scene')).toHaveAttribute('data-reduced-motion', 'false')

    const callback = preference.media.addEventListener.mock.calls[0][1]
    view.unmount()
    expect(preference.media.removeEventListener).toHaveBeenCalledWith('change', callback)
    expect(preference.listeners.size).toBe(0)
  })

  it('remains usable when the browser has no matchMedia support', async () => {
    vi.stubGlobal('matchMedia', undefined)
    render(<StarBackground />)
    await deferred.start()

    expect(screen.getByTestId('mock-star-scene')).toHaveAttribute('data-reduced-motion', 'false')
  })

  it('contains renderer failure, retains a black fallback, and leaves the workspace usable', async () => {
    const preference = mockMotionPreference(false)
    const action = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<><StarBackground /><main><button onClick={action}>Workspace action</button></main></>)
    await deferred.start()
    expect(screen.getByTestId('mock-star-scene')).toBeInTheDocument()

    vi.mocked(Scene).mockImplementation(() => { throw new Error('WebGL renderer unavailable') })
    preference.change(true)

    expect(screen.queryByTestId('mock-star-scene')).not.toBeInTheDocument()
    expect(screen.getByTestId('star-background')).toHaveStyle({ background: '#000', pointerEvents: 'none' })
    fireEvent.click(screen.getByRole('button', { name: 'Workspace action' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('defers hidden startup, retains the renderer on visibility changes and cleans scheduler/listeners', async () => {
    mockMotionPreference(false)
    const changeVisibility = visibility('hidden')
    const remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<StarBackground />)
    expect(deferred.frames.size).toBe(0)
    await deferred.start()
    expect(Scene).not.toHaveBeenCalled()
    changeVisibility('visible')
    await deferred.start()
    const scene = screen.getByTestId('mock-star-scene')
    changeVisibility('hidden')
    expect(scene).toHaveAttribute('data-page-visible', 'false')
    changeVisibility('visible')
    expect(screen.getByTestId('mock-star-scene')).toBe(scene)
    expect(scene).toHaveAttribute('data-page-visible', 'true')
    view.unmount()
    for (const name of ['visibilitychange', 'focusin', 'focusout']) {
      expect(remove).toHaveBeenCalledWith(name, expect.any(Function))
    }
    expect(deferred.frames.size).toBe(0)
    expect(deferred.idle.size).toBe(0)
  })

  it('pauses during native editing without moving focus and resumes on blur', async () => {
    mockMotionPreference(false)
    render(<><StarBackground /><input aria-label="Research title" /><div tabIndex={0} contentEditable aria-label="Editable notes" /><button>Continue</button></>)
    await deferred.start()
    const scene = screen.getByTestId('mock-star-scene'), field = screen.getByRole('textbox', { name: 'Research title' })
    act(() => field.focus())
    expect(field).toHaveFocus()
    expect(scene).toHaveAttribute('data-editing', 'true')
    act(() => screen.getByLabelText('Editable notes').focus())
    expect(scene).toHaveAttribute('data-editing', 'true')
    act(() => screen.getByRole('button', { name: 'Continue' }).focus())
    expect(scene).toHaveAttribute('data-editing', 'false')
    expect(screen.getByTestId('mock-star-scene')).toBe(scene)
  })

  it('cancels pending startup on unmount and offers a task fallback without requestIdleCallback', async () => {
    mockMotionPreference(false)
    const view = render(<StarBackground />)
    const stale = [...deferred.frames.values()][0]
    view.unmount();act(() => stale(0))
    expect(deferred.frames.size).toBe(0)
    expect(deferred.idle.size).toBe(0)
    expect(Scene).not.toHaveBeenCalled()

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.stubGlobal('requestIdleCallback', undefined)
    render(<StarBackground />)
    deferred.paint();deferred.paint()
    expect(Scene).not.toHaveBeenCalled()
    await act(async () => { vi.runOnlyPendingTimers() })
    expect(screen.getByTestId('mock-star-scene')).toBeInTheDocument()
  })

  it('bounds the flat renderer and pauses group rotation and the unlit shader while preserving the point field', async () => {
    const actualScene = (await vi.importActual<typeof import('../src/components/backgrounds/starsBackground/Scene')>('../src/components/backgrounds/starsBackground/Scene')).default
    for (const policy of [{ reducedMotion: true }, { reducedMotion: false, pageVisible: false }, { reducedMotion: false, editing: true }]) {
      const scene = actualScene(policy)
      expect(scene.props.frameloop).toBe('demand')
      expect(scene.props.dpr).toEqual([1, 1.5])
      expect(scene.props.gl).toEqual({ alpha: false, antialias: false })
      expect(scene.props.flat).toBe(true)
      const suspense = Children.toArray(scene.props.children).find(child => isValidElement(child) && child.type === Suspense)
      expect(isValidElement<{ children: { props: { reducedMotion: boolean } } }>(suspense) && suspense.props.children.props.reducedMotion).toBe(true)
    }
    expect(actualScene({ reducedMotion: false }).props.frameloop).toBe('always')
    const actualModel = (await vi.importActual<typeof import('../src/components/backgrounds/starsBackground/Model')>('../src/components/backgrounds/starsBackground/Model')).default
    const model = renderHook(({ paused }) => actualModel.type({ reducedMotion: paused }), { initialProps: { paused: false } })
    const children = () => Children.toArray(model.result.current.props.children).filter(isValidElement)
    const star = () => children().find(child => child.type === Stars)!
    const props = star().props as { speed: number; count: number; factor: number; radius: number; fade: boolean; ref: { current: Points | null } }
    expect(props).toMatchObject({ speed: 1, count: 7500, radius: 200, factor: 4, fade: true })
    const points = new Points();props.ref.current = points
    vi.mocked(useFrame).mock.calls.at(-1)![0]({} as RootState, 1)
    expect(points.rotation.y).toBeCloseTo(0.015)
    model.rerender({ paused: true })
    expect(star().props).toHaveProperty('speed', 0)
    vi.mocked(useFrame).mock.calls.at(-1)![0]({} as RootState, 1)
    expect(points.rotation.y).toBeCloseTo(0.015)
    expect(children()).toHaveLength(1)
    expect(children()[0].type).toBe(Stars)
    model.unmount();points.geometry.dispose();(points.material as { dispose: () => void }).dispose()
  })
})
