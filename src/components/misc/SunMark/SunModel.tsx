import { useCallback, useLayoutEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { Mesh, type Group, type WebGLRenderer } from 'three'
import { useObjectRotation, type RotationAxis } from '../../glass-objects/useObjectRotation'

// Same source mesh/material, with a 2K display map; the original 4K sun.glb is retained.
export const SUN_MODEL_URL = `${import.meta.env.BASE_URL}media/sun/sun-display.glb`
export type SunRotationAxis = RotationAxis
export type SunModelProps = ThreeElements['group'] & {
  animate?: boolean
  rotationAxis?: SunRotationAxis
  rotationSpeed?: number
  onReady?: () => void
}

/** Calendar4's original textured Sun: unchanged mesh, material and 0.0285 × 100 scale. */
export default function SunModel({
  animate = true, rotationAxis = 'y', rotationSpeed = -0.45, onReady, ...props
}: SunModelProps) {
  const { nodes, materials } = useGLTF(SUN_MODEL_URL, false, false)
  const sun = nodes.Sphere_Material002_0
  const material = materials['Material.002']
  if (!(sun instanceof Mesh) || !sun.geometry || !material) {
    throw new Error('The Sun asset is missing its source mesh or material.')
  }

  const rotation = useRef<Group>(null)
  const live = useRef(true)
  const reported = useRef(false)
  const readyCallback = useRef(onReady)
  useObjectRotation(rotation, { spin: animate, rotationAxis, rotationSpeed })
  useLayoutEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])
  useLayoutEffect(() => { readyCallback.current = onReady }, [onReady])

  const afterRender = useCallback((renderer: WebGLRenderer) => {
    if (!live.current || reported.current || renderer.getRenderTarget() !== null) return
    reported.current = true
    readyCallback.current?.()
  }, [])

  return (
    <group ref={rotation} scale={0.0285} {...props} dispose={null}>
      <mesh geometry={sun.geometry} material={material} rotation={[-Math.PI / 2, 0, 0]}
        scale={100} dispose={null} onAfterRender={afterRender} />
    </group>
  )
}

// Imported only by the visible scene's lazy renderer. No decoder/CDN is needed.
useGLTF.preload(SUN_MODEL_URL, false, false)
