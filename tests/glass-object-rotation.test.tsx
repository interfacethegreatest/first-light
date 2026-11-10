import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { RootState } from '@react-three/fiber'
import { Group } from 'three'
import { useObjectRotation, type RotationAxis } from '../src/components/glass-objects/useObjectRotation'

const frames = vi.hoisted(() => ({ callback: null as ((state: RootState, delta: number) => void) | null }))

// Only scheduling is mocked: each test executes the real hook callback against
// Three's actual Group/Euler objects, without a WebGL renderer.
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: RootState, delta: number) => void) => { frames.callback = callback },
}))

function frame(delta: number) {
  if (!frames.callback) throw new Error('Rotation did not register a frame callback')
  frames.callback({} as RootState, delta)
}

beforeEach(() => { frames.callback = null })

describe('glass object rotation by elapsed time', () => {
  const axes = ['x', 'y', 'z'] as const

  it.each(axes.flatMap(axis => [30, 60, 120].map(fps => ({ axis, fps }))))(
    'makes the same quarter-turn around $axis over two seconds at $fps FPS',
    ({ axis, fps }) => {
      const group = new Group()
      const initial = { x: 0.2, y: -0.4, z: 0.3 }
      group.rotation.set(initial.x, initial.y, initial.z)
      renderHook(() => useObjectRotation({ current: group }, { rotationAxis: axis, rotationSpeed: Math.PI / 4 }))

      for (let index = 0; index < fps * 2; index++) frame(1 / fps)

      for (const component of axes) {
        expect(group.rotation[component]).toBeCloseTo(initial[component] + (component === axis ? Math.PI / 2 : 0), 12)
      }
    },
  )

  it('defaults to a positive 0.3-radian turn around y after one second', () => {
    const group = new Group()
    renderHook(() => useObjectRotation({ current: group }))
    for (let index = 0; index < 60; index++) frame(1 / 60)
    expect(group.rotation.y).toBeCloseTo(0.3, 12)
    expect(group.rotation.x).toBe(0)
    expect(group.rotation.z).toBe(0)
  })

  it('honors negative speed and complete irregular deltas without a frame-size clamp', () => {
    const group = new Group()
    renderHook(() => useObjectRotation({ current: group }, { rotationAxis: 'z', rotationSpeed: -0.5 }))
    for (const delta of [0.2, 0.3, 0, 0.5, 2]) frame(delta)
    expect(group.rotation.z).toBeCloseTo(-1.5, 12)
    expect(group.rotation.x).toBe(0)
    expect(group.rotation.y).toBe(0)
  })

  it.each([{ spin: false, rotationSpeed: 0.3 }, { spin: true, rotationSpeed: 0 }])(
    'keeps an existing angle when spin=$spin and speed=$rotationSpeed', options => {
      const group = new Group()
      group.rotation.set(0.2, 0.4, -0.3)
      renderHook(() => useObjectRotation({ current: group }, options))
      for (const delta of [1 / 60, 1, 20]) frame(delta)
      expect(group.rotation.toArray()).toEqual([0.2, 0.4, -0.3, 'XYZ'])
    },
  )

  it('waits safely for a missing group ref', () => {
    const ref: { current: Group | null } = { current: null }
    renderHook(() => useObjectRotation(ref))
    expect(() => frame(10)).not.toThrow()
    ref.current = new Group()
    frame(0.25)
    expect(ref.current.rotation.y).toBeCloseTo(0.075, 12)
  })

  it('resumes from the same angle without catching up idle time, even without paused frames', () => {
    const group = new Group()
    const view = renderHook(({ spin }) => useObjectRotation({ current: group }, { spin }), { initialProps: { spin: true } })
    frame(1)
    expect(group.rotation.y).toBeCloseTo(0.3, 12)
    view.rerender({ spin: false })
    frame(100)
    expect(group.rotation.y).toBeCloseTo(0.3, 12)
    view.rerender({ spin: true })
    frame(100)
    expect(group.rotation.y).toBeCloseTo(0.3, 12)
    frame(2)
    expect(group.rotation.y).toBeCloseTo(0.9, 12)

    view.rerender({ spin: false })
    view.rerender({ spin: true })
    frame(500)
    expect(group.rotation.y).toBeCloseTo(0.9, 12)
    frame(0.5)
    expect(group.rotation.y).toBeCloseTo(1.05, 12)
  })

  it('treats zero speed as a pause and does not reset an angle on axis/speed changes', () => {
    const group = new Group()
    const view = renderHook(
      ({ axis, speed }: { axis: RotationAxis; speed: number }) => useObjectRotation({ current: group }, { rotationAxis: axis, rotationSpeed: speed }),
      { initialProps: { axis: 'y' as RotationAxis, speed: 0.3 } },
    )
    frame(1)
    view.rerender({ axis: 'x', speed: -0.6 })
    frame(0.5)
    expect(group.rotation.x).toBeCloseTo(-0.3, 12)
    expect(group.rotation.y).toBeCloseTo(0.3, 12)
    view.rerender({ axis: 'x', speed: 0 })
    frame(50)
    view.rerender({ axis: 'x', speed: -0.6 })
    frame(50)
    expect(group.rotation.x).toBeCloseTo(-0.3, 12)
    frame(0.5)
    expect(group.rotation.x).toBeCloseTo(-0.6, 12)
  })
})
