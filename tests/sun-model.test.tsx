import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { Group } from 'three'
import type { RootState } from '@react-three/fiber'

const frames = vi.hoisted(() => ({ callback: null as null | ((state: RootState, delta: number) => void) }))
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: RootState, delta: number) => void) => { frames.callback = callback },
}))
vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(() => ({
    nodes: { Sphere_Material002_0: { geometry: {} } },
    materials: { 'Material.002': {} },
  }), { preload: vi.fn() }),
}))
import Sun from '../src/components/react three fibre/sunScene/Sun'

afterEach(() => { frames.callback = null })

describe('Sun time-based motion', () => {
  it.each([30, 60, 120])('preserves the source speed for one second at %s FPS', fps => {
    const { result } = renderHook(() => Sun({ animate: true }))
    const group = new Group()
    result.current.props.ref.current = group
    act(() => { for (let frame = 0; frame < fps; frame++) frames.callback!({} as RootState, 1 / fps) })
    expect(group.rotation.y).toBeCloseTo(-0.45, 10)
  })

  it('holds still while paused and skips the accumulated idle delta when resumed', () => {
    const { result, rerender } = renderHook(({ animate }) => Sun({ animate }), { initialProps: { animate: true } })
    const group = new Group()
    result.current.props.ref.current = group
    act(() => frames.callback!({} as RootState, 1))
    rerender({ animate: false })
    act(() => frames.callback!({} as RootState, 60))
    expect(group.rotation.y).toBeCloseTo(-0.45)
    rerender({ animate: true })
    act(() => frames.callback!({} as RootState, 60))
    expect(group.rotation.y).toBeCloseTo(-0.45)
    act(() => frames.callback!({} as RootState, 1 / 60))
    expect(group.rotation.y).toBeCloseTo(-0.4575)
  })
})
