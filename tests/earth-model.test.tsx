import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

const gpu = vi.hoisted(() => ({
  frame: null as ((state: unknown, delta: number) => void) | null,
  load: vi.fn(), preload: vi.fn(),
}))
vi.mock('@react-three/fiber', () => ({ useFrame: (callback: typeof gpu.frame) => { gpu.frame = callback } }))
vi.mock('@react-three/drei', () => ({ useGLTF: Object.assign(gpu.load, { preload: gpu.preload }) }))

beforeEach(() => {
  gpu.frame = null
  gpu.load.mockReturnValue({
    nodes: { Object_4: new Mesh(new BoxGeometry(), new MeshStandardMaterial()) },
    materials: { 'Scene_-_Root': new MeshStandardMaterial() },
  })
})
afterEach(() => vi.unstubAllEnvs())

function tick(delta: number) {
  if (!gpu.frame) throw new Error('Earth did not subscribe to actual frame scheduling')
  gpu.frame({}, delta)
}

describe('actual source Earth model', () => {
  it.each([30, 60, 120])('makes the same elapsed turn at %s FPS without changing other Euler components', async fps => {
    const { default: EarthModel } = await import('../src/components/misc/EarthMark/EarthModel')
    const view = renderHook(() => EarthModel({ animate: true }))
    const group = new Group();group.rotation.set(0.2, 0.4, -0.3)
    view.result.current.props.ref.current = group
    for (let i=0;i<fps;i++) tick(1/fps)
    expect(group.rotation.x).toBe(0.2)
    expect(group.rotation.y).toBeCloseTo(0.28, 12)
    expect(group.rotation.z).toBe(-0.3)
  })

  it('applies the requested axis and signed speed, pauses without losing angle, and discards idle time on resume', async () => {
    const { default: EarthModel } = await import('../src/components/misc/EarthMark/EarthModel')
    const view = renderHook(({ animate, rotationSpeed }) => EarthModel({ animate, rotationAxis: 'z', rotationSpeed }), { initialProps: { animate: true, rotationSpeed: 0.3 } })
    const group = new Group();view.result.current.props.ref.current=group
    for(const delta of [0.1,0.2,0.05,0.65]) tick(delta)
    expect(group.rotation.z).toBeCloseTo(0.3,12)
    view.rerender({ animate: false,rotationSpeed: 0.3 });tick(100)
    expect(group.rotation.z).toBeCloseTo(0.3,12)
    view.rerender({ animate: true,rotationSpeed: -0.6 });tick(100);tick(0.5)
    expect(group.rotation.z).toBeCloseTo(0,12)
    view.rerender({ animate: true,rotationSpeed: 0 });tick(100)
    expect(group.rotation.toArray()).toEqual([0,0,expect.closeTo(0,12),'XYZ'])
    view.result.current.props.ref.current=null
    expect(()=>tick(1)).not.toThrow()
  })

  it('shares original source geometry/material without Moon alignment or mutation and reports only the first actual draw', async () => {
    const { default: EarthModel } = await import('../src/components/misc/EarthMark/EarthModel')
    const asset=gpu.load.getMockImplementation()!()
    const geometry=asset.nodes.Object_4.geometry,material=asset.materials['Scene_-_Root']
    const positions=geometry.getAttribute('position').array.slice(),dispose=vi.spyOn(geometry,'dispose')
    const ready=vi.fn(),first=renderHook(()=>EarthModel({onReady:ready})),second=renderHook(()=>EarthModel({}))
    for(const view of [first,second]) {
      const model=view.result.current,mesh=model.props.children
      expect(model.props.dispose).toBeNull()
      expect(mesh.props.geometry).toBe(geometry);expect(mesh.props.material).toBe(material)
      expect(mesh.props.scale).toBe(2.8)
      expect(mesh.props.rotation ?? [0,0,0]).toEqual([0,0,0])
    }
    expect(ready).not.toHaveBeenCalled()
    first.result.current.props.children.props.onAfterRender({getRenderTarget:()=>({})})
    expect(ready).not.toHaveBeenCalled()
    first.result.current.props.children.props.onAfterRender({getRenderTarget:()=>null})
    first.result.current.props.children.props.onAfterRender({getRenderTarget:()=>null})
    expect(ready).toHaveBeenCalledOnce()
    first.unmount();second.unmount()
    expect(dispose).not.toHaveBeenCalled()
    expect(geometry.getAttribute('position').array).toEqual(positions)
  })

  it.each(['mesh','material'])('rejects absent source %s instead of presenting a loaded Earth', async missing => {
    const { default: EarthModel } = await import('../src/components/misc/EarthMark/EarthModel')
    const asset=gpu.load.getMockImplementation()!()
    if(missing==='mesh') asset.nodes.Object_4=undefined
    else asset.materials['Scene_-_Root']=undefined
    gpu.load.mockReturnValue(asset)
    expect(()=>renderHook(()=>EarthModel({}))).toThrow(/mesh|material/i)
  })

  it.each(['/','/first-light/'])('loads and preloads the same canonical packed asset under %s',async base=>{
    vi.stubEnv('BASE_URL',base);vi.resetModules()
    const {default:EarthModel,EARTH_MODEL_URL}=await import('../src/components/misc/EarthMark/EarthModel')
    renderHook(()=>EarthModel({}))
    expect(EARTH_MODEL_URL).toBe(`${base}media/earth/earth-icon.glb`)
    expect(gpu.load).toHaveBeenCalledWith(EARTH_MODEL_URL,false,false)
    expect(gpu.preload).toHaveBeenCalledWith(EARTH_MODEL_URL,false,false)
  })
})
