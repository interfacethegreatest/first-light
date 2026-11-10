import { useCallback, useLayoutEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, type Group, type WebGLRenderer } from 'three'
import { useObjectRotation, type RotationAxis } from '../../glass-objects/useObjectRotation'

export const EARTH_MODEL_URL = `${import.meta.env.BASE_URL}media/earth/earth-icon.glb`
export type EarthRotationAxis = RotationAxis

export interface EarthModelProps {
  animate?: boolean
  rotationAxis?: EarthRotationAxis
  rotationSpeed?: number
  onReady?: () => void
}

/** Calendar4's Earth mesh/material and 2.8 scale, without Moon-specific transforms. */
export default function EarthModel({
  animate = false,
  rotationAxis = 'y',
  rotationSpeed = -0.12,
  onReady,
}: EarthModelProps) {
  const { nodes, materials } = useGLTF(EARTH_MODEL_URL, false, false)
  const earth = nodes.Object_4
  const material = materials['Scene_-_Root']
  if (!(earth instanceof Mesh) || !earth.geometry || !material) {
    throw new Error('The Earth asset is missing its source mesh or material.')
  }

  const rotation = useRef<Group>(null)
  const reported = useRef(false)
  const live = useRef(true)
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
    <group ref={rotation} dispose={null}>
      <mesh
        geometry={earth.geometry}
        material={material}
        scale={2.8}
        dispose={null}
        onAfterRender={afterRender}
      />
    </group>
  )
}

// This module is imported only by the lazily requested client renderer.
useGLTF.preload(EARTH_MODEL_URL, false, false)
