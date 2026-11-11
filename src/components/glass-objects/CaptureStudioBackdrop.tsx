import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, LinearFilter, SRGBColorSpace, type Scene, type Texture } from 'three'

/** This canvas has one screen pass and Drei's offscreen transmission captures.
 * Studio radiance belongs only to those captures; the displayed background is clear.
 * A future postprocessing pipeline would need to distinguish its own render targets. */
export function installCaptureBackdrop(scene: Scene, texture: Texture) {
  const previousBackground = scene.background
  const previousBeforeRender = scene.onBeforeRender
  let active = true
  const beforeRender: Scene['onBeforeRender'] = function (...args) {
    previousBeforeRender.apply(scene, args)
    if (active) scene.background = args[0].getRenderTarget() === null ? null : texture
  }
  scene.background = null
  scene.onBeforeRender = beforeRender
  return () => {
    active = false
    // A later owner may have installed/chained its own callback and backdrop.
    if (scene.onBeforeRender !== beforeRender) return
    scene.onBeforeRender = previousBeforeRender
    if (scene.background === null || scene.background === texture) scene.background = previousBackground
  }
}

/** No mesh, photograph, remote HDR or extra render pass. */
export default function CaptureStudioBackdrop({ tone = 'neutral' }: { tone?: 'neutral' | 'dark' }) {
  const scene = useThree(state => state.scene)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) throw new Error('The glass studio capture could not be created.')
    const gradient = context.createLinearGradient(0, 0, 0, 512)
    const stops: Array<[number, string]> = tone === 'dark'
      ? [[0, '#080b14'], [0.2, '#131b29'], [0.47, '#283345'],
        [0.58, '#47576c'], [0.7, '#1b2638'], [1, '#0b0f19']]
      : [[0, '#10151f'], [0.2, '#3c4655'], [0.47, '#b9c3d0'],
        [0.58, '#e4eaf1'], [0.7, '#6e7d91'], [1, '#161d29']]
    stops.forEach(([offset, colour]) => gradient.addColorStop(offset, colour))
    context.fillStyle = gradient
    context.fillRect(0, 0, 512, 512)
    const result = new CanvasTexture(canvas)
    result.name = `first-light-capture-only-studio-${tone}`
    result.colorSpace = SRGBColorSpace
    result.minFilter = result.magFilter = LinearFilter
    result.generateMipmaps = false
    return result
  }, [tone])
  useLayoutEffect(() => {
    texture.needsUpdate = true
    const uninstall = installCaptureBackdrop(scene, texture)
    return () => {
      uninstall()
      texture.dispose()
    }
  }, [scene, texture])
  return null
}
