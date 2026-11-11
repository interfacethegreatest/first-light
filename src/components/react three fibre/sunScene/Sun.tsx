import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { useObjectRotation } from '../../glass-objects/useObjectRotation'

const SUN_MODEL_URL = `${import.meta.env.BASE_URL}media/sun/sun.gltf`

export default function Model({ animate = true, ...props }: ThreeElements['group'] & { animate?: boolean }) {
  const { nodes, materials } = useGLTF(SUN_MODEL_URL)
  const sunRef = useRef<Group>(null)

  // Match Calendar4's 0.0075 radians/frame at 60 FPS without speeding up on
  // high-refresh displays or jumping over a paused demand-render interval.
  useObjectRotation(sunRef, { spin: animate, rotationSpeed: -0.45 })

  return (
    <group ref={sunRef} scale={0.0285} {...props} dispose={null}>
      <mesh
        geometry={(nodes.Sphere_Material002_0 as Mesh).geometry}
        material={materials['Material.002']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={100}
      />
    </group>
  )
}

useGLTF.preload(SUN_MODEL_URL)
