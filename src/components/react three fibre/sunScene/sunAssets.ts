export const SUN_MODEL_URL = `${import.meta.env.BASE_URL}media/sun/sun.gltf`
export const SUN_ENVIRONMENT_URL = `${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`
export const SUN_PREVIEW_URL = `${import.meta.env.BASE_URL}media/sun/sun-preview.png`

let warmup: Promise<void> | undefined

/** Schedule both assets in the same loader caches used by the live scene. */
export function preloadSunAssets(): Promise<void> {
  if (!warmup) {
    const request = import('@react-three/drei').then(({ useGLTF, useEnvironment }) => {
      useGLTF.preload(SUN_MODEL_URL)
      useEnvironment.preload({ files: SUN_ENVIRONMENT_URL })
    })
    warmup = request
    void request.catch(() => {
      if (warmup === request) warmup = undefined
    })
  }
  return warmup
}

/** Remove rejected loader entries before a bounded automatic retry. */
export async function clearSunAssetCache(): Promise<void> {
  const { useGLTF, useEnvironment } = await import('@react-three/drei')
  useGLTF.clear(SUN_MODEL_URL)
  useEnvironment.clear({ files: SUN_ENVIRONMENT_URL })
  warmup = undefined
}
