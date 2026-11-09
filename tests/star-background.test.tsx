import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import Scene from '../src/components/backgrounds/starsBackground/Scene'
import StarBackground from '../src/components/backgrounds/starsBackground/StarBackground'

vi.mock('../src/components/backgrounds/starsBackground/Scene', () => ({
  default: vi.fn(),
}))

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
  vi.mocked(Scene).mockImplementation(({ reducedMotion }) => (
    <div data-testid="mock-star-scene" data-reduced-motion={String(reducedMotion)} />
  ))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('decorative star background', () => {
  it('stays behind the workspace and cannot intercept pointer or keyboard input', () => {
    mockMotionPreference(false)
    const action = vi.fn()
    render(<><StarBackground /><main><button onClick={action}>Workspace action</button></main></>)

    const background = screen.getByTestId('star-background')
    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(background).not.toHaveAttribute('tabindex')
    expect(background).toHaveStyle({ position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none' })
    expect(screen.getByTestId('mock-star-scene')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Workspace action' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it.each([false, true])('passes the initial reduced-motion preference (%s) to the renderer', reducedMotion => {
    const preference = mockMotionPreference(reducedMotion)
    render(<StarBackground />)

    expect(preference.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(screen.getByTestId('mock-star-scene')).toHaveAttribute('data-reduced-motion', String(reducedMotion))
  })

  it('updates the renderer when reduced motion changes and removes the subscription on unmount', () => {
    const preference = mockMotionPreference(false)
    const view = render(<StarBackground />)
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

  it('remains usable when the browser has no matchMedia support', () => {
    vi.stubGlobal('matchMedia', undefined)
    render(<StarBackground />)

    expect(screen.getByTestId('mock-star-scene')).toHaveAttribute('data-reduced-motion', 'false')
  })

  it('contains renderer failure, retains a black fallback, and leaves the workspace usable', () => {
    const preference = mockMotionPreference(false)
    const action = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<><StarBackground /><main><button onClick={action}>Workspace action</button></main></>)
    expect(screen.getByTestId('mock-star-scene')).toBeInTheDocument()

    vi.mocked(Scene).mockImplementation(() => { throw new Error('WebGL renderer unavailable') })
    preference.change(true)

    expect(screen.queryByTestId('mock-star-scene')).not.toBeInTheDocument()
    expect(screen.getByTestId('star-background')).toHaveStyle({ background: '#000', pointerEvents: 'none' })
    fireEvent.click(screen.getByRole('button', { name: 'Workspace action' }))
    expect(action).toHaveBeenCalledOnce()
  })
})
