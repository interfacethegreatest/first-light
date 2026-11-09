import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Group, Mesh, MeshBasicMaterial, Points } from 'three'

const harness = vi.hoisted(() => ({
  targetRef: { current: null as unknown },
  frames: [] as Array<(state: unknown, delta: number) => void>,
  load: vi.fn(),
  preload: vi.fn(),
}))

// Call the real model functions and their registered frame callbacks without
// mounting Three intrinsics or starting a GPU renderer. Keep real Three objects.
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useRef: (initial: unknown) => initial === null ? harness.targetRef : { current: initial },
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
  const ref = { current: target }
  harness.targetRef = ref
  if (kind === 'sun') {
    const { default: Sun } = await import('../src/components/react three fibre/sunScene/Sun')
    Sun({ reducedMotion, onReady: vi.fn() })
  } else {
    const { default: Model } = await import('../src/components/backgrounds/starsBackground/Model')
    Model({ reducedMotion })
  }
  return { ref, frame: harness.frames.at(-1)! }
}

beforeEach(() => {
  harness.frames.length = 0
  harness.targetRef = { current: null }
  harness.load.mockReturnValue({
    nodes: { Sphere_Material002_0: new Mesh() },
    materials: { 'Material.002': new MeshBasicMaterial() },
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('actual model frame callbacks', () => {
  it.each([30, 60, 144])('rotates the Sun by the same angle over one second at %s FPS', async fps => {
    const sun = new Group()
    sun.rotation.set(0.3, 0.4, -0.2)
    const { frame } = await frameFor('sun', sun)

    for (let index = 0; index < fps; index++) frame({}, 1 / fps)

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

  it.each(['sun', 'stars'] as const)('uses elapsed deltas through irregular frames for %s', async kind => {
    const target = kind === 'sun' ? new Group() : new Points()
    target.rotation.y = 0.4
    const { frame } = await frameFor(kind, target)

    // Different frame durations, totalling one second, must match the regular
    // frame runs rather than multiplying by the number of callbacks.
    for (const delta of [0.012, 0.038, 0.15, 0.3, 0.05, 0.2, 0.25]) frame({}, delta)

    expect(target.rotation.y).toBeCloseTo(kind === 'sun' ? -0.05 : 0.415, 10)
    if (kind === 'stars') expect(target.rotation.x).toBe(target.rotation.y)
  })

  it.each(['sun', 'stars'] as const)('leaves all axes unchanged for reduced-motion %s', async kind => {
    const target = kind === 'sun' ? new Group() : new Points()
    target.rotation.set(-0.7, 0.4, 0.2)
    const { frame } = await frameFor(kind, target, true)

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

describe('canonical Sun asset URL', () => {
  it.each(['/', '/first-light/'])('loads and preloads the identical model URL with base %s', async base => {
    vi.stubEnv('BASE_URL', base)
    vi.resetModules()
    const { default: Sun } = await import('../src/components/react three fibre/sunScene/Sun')
    harness.targetRef = { current: new Group() }

    Sun({ reducedMotion: false, onReady: vi.fn() })

    const expected = `${base}media/sun/sun.gltf`
    expect(harness.load).toHaveBeenCalledOnce()
    expect(harness.load).toHaveBeenCalledWith(expected)
    expect(harness.preload).toHaveBeenCalledOnce()
    expect(harness.preload).toHaveBeenCalledWith(expected)
  })
})
