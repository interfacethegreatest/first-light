import { useEffect, useMemo } from 'react'
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

/** Neutral studio radiance, visible and captured by transmission in one scene.
 * No photographs, text, extra meshes or page-HTML capture are involved. */
export default function GlassCaptureBackdrop() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) throw new Error('The glass studio backdrop could not be created.')
    const gradient = context.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#10151f')
    gradient.addColorStop(0.2, '#3c4655')
    gradient.addColorStop(0.47, '#b9c3d0')
    gradient.addColorStop(0.58, '#e4eaf1')
    gradient.addColorStop(0.7, '#6e7d91')
    gradient.addColorStop(1, '#161d29')
    context.fillStyle = gradient
    context.fillRect(0, 0, 512, 512)
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.minFilter = LinearFilter
    result.magFilter = LinearFilter
    result.generateMipmaps = false
    result.name = 'first-light-neutral-glass-backdrop'
    return result
  }, [])
  useEffect(() => {
    // StrictMode may repeat effect setup after disposal; allow re-upload.
    texture.needsUpdate = true
    return () => texture.dispose()
  }, [texture])
  return <primitive attach="background" object={texture} />
}
