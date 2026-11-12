import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Group, Mesh, MeshBasicMaterial, Points } from 'three'
import { renderHook } from '@testing-library/react'
import { isValidElement, type ReactElement } from 'react'

const harness = vi.hoisted(() => ({
  frames: [] as Array<(state: unknown, delta: number) => void>,
  load: vi.fn(),
  preload: vi.fn(),
}))

// Execute real model hooks and their frame callbacks without mounting Three
// intrinsics or starting a GPU renderer. Unwrap only memo for the star hook fixture.
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    memo: (component: unknown) => component,
  }
})
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: unknown, delta: number) => void) => { harness.frames.push(callback) },
}))
vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(harness.load, { preload: harness.preload }),
  Stars: () => null,
}))
vi.mock('@react-three/postprocessing', () => ({ Bloom: () => null, EffectComposer: () => null }))

type ModelKind = 'sun' | 'stars'

async function frameFor(kind: ModelKind, target: Group | Points | null, reducedMotion = false) {
  let ref: { current: Group | Points | null }
  if (kind === 'sun') {
    const { default: Sun } = await import('../src/components/react three fibre/sunScene/Sun')
    const { result } = renderHook(() => Sun({}))
    ref = result.current.props.ref
  } else {
    const { default: Model } = await import('../src/components/backgrounds/starsBackground/Model')
    const { result } = renderHook(() => Model({ reducedMotion }))
    if (!isValidElement<{ children: ReactElement<{ ref: typeof ref }> }>(result.current)) throw new Error('Missing star group')
    ref = result.current.props.children.props.ref
  }
  ref.current = target
  return { ref, frame: harness.frames.at(-1)! }
}

beforeEach(() => {
  harness.frames.length = 0
  harness.load.mockReturnValue({
    nodes: { Sphere_Material002_0: new Mesh() },
    materials: { 'Material.002': new MeshBasicMaterial() },
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('actual model frame callbacks', () => {
  it.each([30, 60, 144])('preserves the source Sun speed over one second at %s FPS', async frames => {
    const sun = new Group()
    sun.rotation.set(0.3, 0.4, -0.2)
    const { frame } = await frameFor('sun', sun)

    for (let index = 0; index < frames; index++) frame({}, 1 / frames)

    expect(sun.rotation.y).toBeCloseTo(-0.05, 10)
    expect(sun.rotation.x).toBe(0.3)
    expect(sun.rotation.z).toBe(-0.2)
  })

  it.each([30, 60, 144])('preserves the stars\' x-following-y rotation over one second at %s FPS', async fps => {
    const stars = new Points()
    stars.rotation.set(-0.7, 0.4, 0.2)
    const { frame } = await frameFor('stars', stars)

    for (let index = 0; index < fps; index++) {
      frame({}, 1 / fps)
      expect(stars.rotation.x).toBe(stars.rotation.y)
    }

    expect(stars.rotation.y).toBeCloseTo(0.415, 10)
    expect(stars.rotation.z).toBe(0.2)
  })

  it.each(['sun', 'stars'] as const)('uses elapsed time through irregular frames for %s', async kind => {
    const target = kind === 'sun' ? new Group() : new Points()
    target.rotation.y = 0.4
    const { frame } = await frameFor(kind, target)

    // These irregular frame intervals total one second for either model.
    for (const delta of [0.012, 0.038, 0.15, 0.3, 0.05, 0.2, 0.25]) frame({}, delta)

    expect(target.rotation.y).toBeCloseTo(kind === 'sun' ? -0.05 : 0.415, 10)
    if (kind === 'stars') expect(target.rotation.x).toBe(target.rotation.y)
  })

  it('leaves all star axes unchanged for reduced motion', async () => {
    const target = new Points()
    target.rotation.set(-0.7, 0.4, 0.2)
    const { frame } = await frameFor('stars', target, true)

    frame({}, 1 / 60)
    frame({}, 0.5)

    expect(target.rotation.x).toBe(-0.7)
    expect(target.rotation.y).toBe(0.4)
    expect(target.rotation.z).toBe(0.2)
  })

  it.each(['sun', 'stars'] as const)('tolerates an unattached %s ref and uses its current object when attached', async kind => {
    const { ref, frame } = await frameFor(kind, null)
    expect(() => frame({}, 1)).not.toThrow()
    const target = kind === 'sun' ? new Group() : new Points()
    ref.current = target

    frame({}, 1)

    expect(target.rotation.y).toBeCloseTo(kind === 'sun' ? -0.45 : 0.015, 10)
    if (kind === 'stars') expect(target.rotation.x).toBe(target.rotation.y)
  })
})

describe('source Sun mesh contract', () => {
  it('uses the original geometry/material and preserves group prop overrides and disposal ownership', async () => {
    const { default: Sun } = await import('../src/components/react three fibre/sunScene/Sun')
    const original = harness.load.getMockImplementation()!()
    const normal = renderHook(() => Sun({})).result.current
    expect(normal.props.scale).toBe(0.0285)
    expect(normal.props.dispose).toBeNull()
    const mesh = normal.props.children
    expect(mesh.props.geometry).toBe(original.nodes.Sphere_Material002_0.geometry)
    expect(mesh.props.material).toBe(original.materials['Material.002'])
    expect(mesh.props.scale).toBe(100)
    expect(mesh.props.rotation).toEqual([-Math.PI / 2, 0, 0])

    const positioned = renderHook(() => Sun({ position: [1, 2, 3], scale: 0.5 })).result.current
    expect(positioned.props.position).toEqual([1, 2, 3])
    expect(positioned.props.scale).toBe(0.5)
    expect(positioned.props.dispose).toBeNull()
  })
})

describe('canonical Sun asset URL', () => {
  it.each(['/', '/first-light/'])('loads and preloads the identical model URL with base %s', async base => {
    vi.stubEnv('BASE_URL', base)
    vi.resetModules()
    const { default: Sun } = await import('../src/components/react three fibre/sunScene/Sun')
    renderHook(() => Sun({}))

    const expected = `${base}media/sun/sun-display.glb`
    expect(harness.load).toHaveBeenCalledOnce()
    expect(harness.load).toHaveBeenCalledWith(expected, false, false)
    expect(harness.preload).toHaveBeenCalledOnce()
    expect(harness.preload).toHaveBeenCalledWith(expected, false, false)
  })
})
