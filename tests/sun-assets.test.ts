import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loaders = vi.hoisted(() => ({
  modelPreload: vi.fn(),
  modelClear: vi.fn(),
  environmentPreload: vi.fn(),
  environmentClear: vi.fn(),
}))

vi.mock('@react-three/drei', () => ({
  useGLTF: { preload: loaders.modelPreload, clear: loaders.modelClear },
  useEnvironment: { preload: loaders.environmentPreload, clear: loaders.environmentClear },
}))

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('shared canonical Sun asset warmup', () => {
  it.each(['/', '/first-light/'])('preloads model and HDR once with base %s and shares concurrent warmup', async base => {
    vi.stubEnv('BASE_URL', base)
    const assets = await import('../src/components/react three fibre/sunScene/sunAssets')
    const first = assets.preloadSunAssets()
    const second = assets.preloadSunAssets()
    expect(second).toBe(first)
    await Promise.all([first, second])
    await assets.preloadSunAssets()

    expect(assets.SUN_MODEL_URL).toBe(`${base}media/sun/sun.gltf`)
    expect(assets.SUN_ENVIRONMENT_URL).toBe(`${base}environments/venice_sunset_1k.hdr`)
    expect(assets.SUN_PREVIEW_URL).toBe(`${base}media/sun/sun-preview.png`)
    expect(loaders.modelPreload).toHaveBeenCalledOnce()
    expect(loaders.modelPreload).toHaveBeenCalledWith(assets.SUN_MODEL_URL)
    expect(loaders.environmentPreload).toHaveBeenCalledOnce()
    expect(loaders.environmentPreload).toHaveBeenCalledWith({ files: assets.SUN_ENVIRONMENT_URL })
    expect(loaders.modelClear).not.toHaveBeenCalled()
    expect(loaders.environmentClear).not.toHaveBeenCalled()
  })

  it('clears both canonical loader entries and permits a fresh warmup', async () => {
    const assets = await import('../src/components/react three fibre/sunScene/sunAssets')
    const previous = assets.preloadSunAssets()
    await previous
    await assets.clearSunAssetCache()

    expect(loaders.modelClear).toHaveBeenCalledWith(assets.SUN_MODEL_URL)
    expect(loaders.environmentClear).toHaveBeenCalledWith({ files: assets.SUN_ENVIRONMENT_URL })
    const next = assets.preloadSunAssets()
    expect(next).not.toBe(previous)
    await next
    expect(loaders.modelPreload).toHaveBeenCalledTimes(2)
    expect(loaders.environmentPreload).toHaveBeenCalledTimes(2)
  })

  it.each(['model', 'environment'])('resets rejected warmup after a %s preload scheduling failure', async failed => {
    const target = failed === 'model' ? loaders.modelPreload : loaders.environmentPreload
    target.mockImplementationOnce(() => { throw new Error('Transient preload failure') })
    const assets = await import('../src/components/react three fibre/sunScene/sunAssets')
    const rejected = assets.preloadSunAssets()
    await expect(rejected).rejects.toThrow('Transient preload failure')

    const retry = assets.preloadSunAssets()
    expect(retry).not.toBe(rejected)
    await expect(retry).resolves.toBeUndefined()
    expect(target).toHaveBeenCalledTimes(2)
    expect(loaders.modelPreload).toHaveBeenCalledWith(assets.SUN_MODEL_URL)
    expect(loaders.environmentPreload).toHaveBeenCalledWith({ files: assets.SUN_ENVIRONMENT_URL })
  })
})
