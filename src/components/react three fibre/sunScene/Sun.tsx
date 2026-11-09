import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

const SUN_MODEL_URL = `${import.meta.env.BASE_URL}media/sun/sun.gltf`

export default function Model(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF(SUN_MODEL_URL)
  const sunRef = useRef<Group>(null)

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += -0.0075
    }
  })

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
