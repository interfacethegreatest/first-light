import { useCallback, useLayoutEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Mesh, type Group } from 'three'

export const MOON_MODEL_URL = `${import.meta.env.BASE_URL}media/moon/moon.glb`

export type MoonRotationAxis = 'x' | 'y' | 'z'

interface MoonModelProps {
  animate?: boolean
  rotationAxis?: MoonRotationAxis
  rotationSpeed?: number
  onReady?: () => void
}

// Locally adapted from Calendar4's Moon: preserve its geometry, material,
// Rx(-PI/2), and composed 0.028 × 100 scale. Framing belongs to the camera.
export default function MoonModel({
  animate = false,
  rotationAxis = 'y',
  rotationSpeed = -0.12,
  onReady,
}: MoonModelProps) {
  const { nodes, materials } = useGLTF(MOON_MODEL_URL)
  const moon = nodes.Moon_Moon_0
  const material = materials.Moon
  if (!(moon instanceof Mesh) || !material) {
    throw new Error('The Moon asset is missing its source mesh or material.')
  }

  const rotation = useRef<Group>(null)
  const rendered = useRef(false)
  const readyCallback = useRef(onReady)

  useLayoutEffect(() => {
    readyCallback.current = onReady
  }, [onReady])

  useFrame((_, delta) => {
    if (animate && rotation.current) {
      // Radians per second, applied to the parent without changing the mesh's source alignment.
      rotation.current.rotation[rotationAxis] += rotationSpeed * delta
    }
  })

  const afterRender = useCallback(() => {
    if (rendered.current) return
    rendered.current = true
    readyCallback.current?.()
  }, [])

  return (
    <group ref={rotation} scale={0.028} dispose={null}>
      <mesh
        geometry={moon.geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={100}
        dispose={null}
        onAfterRender={afterRender}
      />
    </group>
  )
}

useGLTF.preload(MOON_MODEL_URL)
