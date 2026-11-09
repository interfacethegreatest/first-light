import { Children, isValidElement, Suspense } from 'react'
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

beforeEach(() => {
  vi.mocked(Canvas).mockImplementation(({ frameloop }) => <div data-testid="canvas-boundary" data-frameloop={frameloop} />)
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
    expect(children.find(child => child.type === Suspense)).toBeDefined()
    expect(children.find(child => child.type === Environment)).toHaveProperty('props.files', `${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`)
  })

  it.each([false, true])('uses the requested initial reduced-motion mode (%s) at the Canvas boundary', reduced => {
    motionPreferences(reduced)
    render(<SunScene />)
    expect(screen.getByTestId('canvas-boundary')).toHaveAttribute('data-frameloop', reduced ? 'demand' : 'always')
  })

  it('updates Canvas motion mode without losing card content, focused output, or native controls and cleans listeners', async () => {
    const preference = motionPreferences()
    const action = vi.fn()
    const user = userEvent.setup()
    const view = render(<NewUserCard headingId="source-scene-heading" title="Source scene card" controls={<button type="button" onClick={action}>Edit card</button>}><label>Output notes<textarea /></label></NewUserCard>)
    const canvas = screen.getByTestId('canvas-boundary')
    const field = screen.getByRole('textbox', { name: 'Output notes' })
    await user.type(field, 'Research draft')
    preference.change(true)
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    preference.change(false)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(screen.getByRole('textbox', { name: 'Output notes' })).toBe(field)
    expect(field).toHaveValue('Research draft')
    expect(field).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Edit card' }))
    expect(action).toHaveBeenCalledOnce()

    view.unmount()
    expect(preference.reduced.listeners.size).toBe(0)
    expect(preference.coarse.listeners.size).toBe(0)
  })
})
