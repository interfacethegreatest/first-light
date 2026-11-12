import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import type { RootState } from '@react-three/fiber'

const harness = vi.hoisted(() => ({
  callback: null as null | ((state: RootState, delta: number) => void),
  load: vi.fn(), preload: vi.fn(),
}))
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: RootState, delta: number) => void) => { harness.callback = callback },
}))
vi.mock('@react-three/drei', () => ({ useGLTF: Object.assign(harness.load, { preload: harness.preload }) }))

import Sun from '../src/components/react three fibre/sunScene/Sun'
import SunModel from '../src/components/misc/SunMark/SunModel'

beforeEach(() => {
  harness.load.mockReturnValue({
    nodes: { Sphere_Material002_0: new Mesh(new BoxGeometry(), new MeshStandardMaterial()) },
    materials: { 'Material.002': new MeshStandardMaterial() },
  })
})
afterEach(() => { harness.callback = null; vi.unstubAllEnvs() })

describe('Sun model resource and elapsed-time behavior', () => {
  it.each([30, 60, 120])('retains the source angular speed for one second at %s FPS', fps => {
    const { result } = renderHook(() => Sun({ animate: true }))
    const group = new Group()
    result.current.props.ref.current = group
    act(() => { for (let frame = 0; frame < fps; frame++) harness.callback!({} as RootState, 1 / fps) })
    expect(group.rotation.y).toBeCloseTo(-0.45, 10)
    expect(group.rotation.x).toBe(0)
    expect(group.rotation.z).toBe(0)
  })

  it.each(['x', 'y', 'z'] as const)('supports the %s axis without changing the other source alignment', rotationAxis => {
    const { result } = renderHook(() => SunModel({ animate: true, rotationAxis, rotationSpeed: 0.3 }))
    const group = new Group()
    result.current.props.ref.current = group
    act(() => { for (const delta of [0.012, 0.038, 0.15, 0.3, 0.05, 0.2, 0.25]) harness.callback!({} as RootState, delta) })
    for (const axis of ['x', 'y', 'z'] as const) expect(group.rotation[axis]).toBeCloseTo(axis === rotationAxis ? 0.3 : 0, 12)
  })

  it('pauses and discards an accumulated idle interval on resume', () => {
    const { result, rerender } = renderHook(({ animate }) => SunModel({ animate }), { initialProps: { animate: true } })
    const group = new Group()
    result.current.props.ref.current = group
    act(() => harness.callback!({} as RootState, 1))
    rerender({ animate: false })
    act(() => harness.callback!({} as RootState, 60))
    expect(group.rotation.y).toBeCloseTo(-0.45)
    rerender({ animate: true })
    act(() => harness.callback!({} as RootState, 60))
    expect(group.rotation.y).toBeCloseTo(-0.45)
    act(() => harness.callback!({} as RootState, 1 / 60))
    expect(group.rotation.y).toBeCloseTo(-0.4575)
  })

  it.each([0, Number.NaN, Number.POSITIVE_INFINITY])('does not corrupt rotation with a disabled/nonfinite speed (%s)', rotationSpeed => {
    const { result } = renderHook(() => SunModel({ animate: true, rotationSpeed }))
    const group = new Group()
    result.current.props.ref.current = group
    act(() => harness.callback!({} as RootState, 1))
    expect(group.rotation.toArray()).toEqual([0, 0, 0, 'XYZ'])
  })

  it('preserves the original geometry, textured material and transforms for multiple instances', () => {
    const asset = harness.load.getMockImplementation()!()
    const geometry = asset.nodes.Sphere_Material002_0.geometry
    const material = asset.materials['Material.002']
    const positions = geometry.getAttribute('position').array.slice()
    const first = renderHook(() => SunModel({})), second = renderHook(() => SunModel({}))
    for (const model of [first.result.current, second.result.current]) {
      expect(model.props.dispose).toBeNull()
      expect(model.props.children.props).toMatchObject({ rotation: [-Math.PI / 2, 0, 0], dispose: null })
      expect(model.props.children.props.geometry).toBe(geometry)
      expect(model.props.children.props.material).toBe(material)
      expect(model.props.scale * model.props.children.props.scale).toBeCloseTo(2.85)
    }
    const disposeGeometry = vi.spyOn(geometry, 'dispose'), disposeMaterial = vi.spyOn(material, 'dispose')
    first.unmount()
    expect(second.result.current.props.children.props.geometry).toBe(geometry)
    expect(geometry.getAttribute('position').array).toEqual(positions)
    expect(disposeGeometry).not.toHaveBeenCalled()
    expect(disposeMaterial).not.toHaveBeenCalled()
  })

  it('reports readiness only after a primary-screen render, once, and ignores stale unmounted callbacks', () => {
    const ready = vi.fn()
    const view = renderHook(() => SunModel({ onReady: ready }))
    const afterRender = view.result.current.props.children.props.onAfterRender
    expect(ready).not.toHaveBeenCalled()
    act(() => afterRender({ getRenderTarget: () => ({}) }))
    expect(ready).not.toHaveBeenCalled()
    act(() => { afterRender({ getRenderTarget: () => null }); afterRender({ getRenderTarget: () => null }) })
    expect(ready).toHaveBeenCalledOnce()
    view.unmount()
    act(() => afterRender({ getRenderTarget: () => null }))
    expect(ready).toHaveBeenCalledOnce()
  })

  it('ignores a queued first-readiness callback after its model instance unmounts', () => {
    const ready = vi.fn()
    const view = renderHook(() => SunModel({ onReady: ready }))
    const afterRender = view.result.current.props.children.props.onAfterRender
    view.unmount()
    act(() => afterRender({ getRenderTarget: () => null }))
    expect(ready).not.toHaveBeenCalled()
  })

  it.each(['mesh', 'material'])('rejects a missing source %s before reporting success', missing => {
    const asset = harness.load.getMockImplementation()!()
    if (missing === 'mesh') asset.nodes.Sphere_Material002_0 = undefined
    else asset.materials['Material.002'] = undefined
    harness.load.mockReturnValue(asset)
    expect(() => renderHook(() => SunModel({}))).toThrow(/mesh|material/i)
  })
})

describe('self-contained Sun URL', () => {
  it.each(['/', '/first-light/'])('loads and preloads the same packed asset under %s without decoder dependencies', async base => {
    vi.stubEnv('BASE_URL', base)
    vi.resetModules()
    harness.load.mockClear(); harness.preload.mockClear()
    const { default: Model, SUN_MODEL_URL } = await import('../src/components/misc/SunMark/SunModel')
    renderHook(() => Model({ animate: false }))
    expect(SUN_MODEL_URL).toBe(`${base}media/sun/sun.glb`)
    expect(harness.load).toHaveBeenCalledWith(SUN_MODEL_URL, false, false)
    expect(harness.preload).toHaveBeenCalledExactlyOnceWith(SUN_MODEL_URL, false, false)
  })
})
