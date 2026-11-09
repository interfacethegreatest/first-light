import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

const harness = vi.hoisted(() => ({
  rotation: { current: null as Group | null },
  frames: [] as Array<(state: unknown, delta: number) => void>,
  load: vi.fn(),
  preload: vi.fn(),
}))

// Execute the actual model and its frame callback with real Three objects,
// without mounting Three intrinsics or creating a GPU renderer.
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useRef: (initial: unknown) => initial === null ? harness.rotation : { current: initial },
  useCallback: (callback: unknown) => callback,
  useLayoutEffect: (effect: () => void) => effect(),
}))
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: unknown, delta: number) => void) => harness.frames.push(callback),
}))
vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(harness.load, { preload: harness.preload }),
}))

beforeEach(() => {
  harness.rotation = { current: new Group() }
  harness.frames.length = 0
  harness.load.mockReturnValue({
    nodes: { Moon_Moon_0: new Mesh(new BoxGeometry(), new MeshStandardMaterial()) },
    materials: { Moon: new MeshStandardMaterial() },
  })
})

afterEach(() => { vi.unstubAllEnvs() })

describe('actual Moon model behavior', () => {
  it.each([30, 60, 120])('rotates by elapsed time over one second at %s FPS', async fps => {
    const { default: MoonModel } = await import('../src/components/misc/MoonMark/MoonModel')
    const group = harness.rotation.current!
    group.rotation.set(0.2, 0.4, -0.3)
    MoonModel({ animate: true })
    const frame = harness.frames.at(-1)!

    for (let index = 0; index < fps; index++) frame({}, 1 / fps)

    expect(group.rotation.y).toBeCloseTo(0.28, 12)
    expect(group.rotation.x).toBe(0.2)
    expect(group.rotation.z).toBe(-0.3)
  })

  it('handles irregular deltas and the supplied rotation speed', async () => {
    const { default: MoonModel } = await import('../src/components/misc/MoonMark/MoonModel')
    MoonModel({ animate: true, rotationSpeed: 0.3 })
    const frame = harness.frames.at(-1)!
    for (const delta of [0.012, 0.038, 0.15, 0.3, 0.05, 0.2, 0.25]) frame({}, delta)
    expect(harness.rotation.current!.rotation.y).toBeCloseTo(0.3, 12)
  })

  it('stays stationary by default and safely waits for its current group ref', async () => {
    const { default: MoonModel } = await import('../src/components/misc/MoonMark/MoonModel')
    const group = harness.rotation.current!
    group.rotation.set(0.2, 0.4, -0.3)
    MoonModel({})
    harness.frames.at(-1)!({}, 1)
    expect(group.rotation.toArray()).toEqual([0.2, 0.4, -0.3, 'XYZ'])

    harness.rotation.current = null
    MoonModel({ animate: true })
    const frame = harness.frames.at(-1)!
    expect(() => frame({}, 1)).not.toThrow()
    harness.rotation.current = new Group()
    frame({}, 0.5)
    expect(harness.rotation.current.rotation.y).toBeCloseTo(-0.06, 12)
  })

  it('reuses the source assets without mutation and retains source transforms and shared disposal ownership', async () => {
    const { default: MoonModel } = await import('../src/components/misc/MoonMark/MoonModel')
    const asset = harness.load.getMockImplementation()!()
    const geometry = asset.nodes.Moon_Moon_0.geometry
    const positions = geometry.getAttribute('position').array.slice()
    const material = asset.materials.Moon
    const first = MoonModel({})
    const second = MoonModel({})

    for (const group of [first, second]) {
      expect(group.props.scale).toBe(0.028)
      expect(group.props.dispose).toBeNull()
      expect(group.props.children.props).toMatchObject({
        geometry, material, rotation: [-Math.PI / 2, 0, 0], scale: 100, dispose: null,
      })
      expect(group.props.children.props.geometry).toBe(geometry)
      expect(group.props.children.props.material).toBe(material)
    }
    expect(geometry.getAttribute('position').array).toEqual(positions)
  })

  it('reports readiness only after the actual mesh renders, once per instance', async () => {
    const { default: MoonModel } = await import('../src/components/misc/MoonMark/MoonModel')
    const ready = vi.fn()
    const model = MoonModel({ onReady: ready })
    expect(ready).not.toHaveBeenCalled()
    model.props.children.props.onAfterRender()
    model.props.children.props.onAfterRender()
    expect(ready).toHaveBeenCalledOnce()
  })

  it.each(['mesh', 'material'])('rejects a missing source %s instead of declaring readiness', async missing => {
    const { default: MoonModel } = await import('../src/components/misc/MoonMark/MoonModel')
    const asset = harness.load.getMockImplementation()!()
    if (missing === 'mesh') asset.nodes.Moon_Moon_0 = undefined
    else asset.materials.Moon = undefined
    harness.load.mockReturnValue(asset)
    expect(() => MoonModel({})).toThrow(/mesh|material/i)
  })
})

describe('canonical packed Moon asset', () => {
  it.each(['/', '/first-light/'])('uses the identical load and preload URL under %s', async base => {
    vi.stubEnv('BASE_URL', base)
    vi.resetModules()
    const { default: MoonModel, MOON_MODEL_URL } = await import('../src/components/misc/MoonMark/MoonModel')
    MoonModel({})
    expect(MOON_MODEL_URL).toBe(`${base}media/moon/moon.glb`)
    expect(harness.load).toHaveBeenCalledOnce()
    expect(harness.load).toHaveBeenCalledWith(MOON_MODEL_URL)
    expect(harness.preload).toHaveBeenCalledOnce()
    expect(harness.preload).toHaveBeenCalledWith(MOON_MODEL_URL)
  })
})
