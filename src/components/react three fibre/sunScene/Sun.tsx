import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Mesh, type Group } from 'three'

const SUN_MODEL_URL = `${import.meta.env.BASE_URL}media/sun/sun.gltf`
const SUN_ROTATION_RADIANS_PER_SECOND = -0.45

interface SunProps {
  reducedMotion: boolean
  onReady: () => void
}

export default function Sun({ reducedMotion, onReady }: SunProps) {
  // Relative references inside this unchanged GLTF resolve beside the model:
  // sun.bin and textures/Material.002_baseColor.jpeg.
  const { nodes, materials } = useGLTF(SUN_MODEL_URL)
  const sunRef = useRef<Group>(null)
  const announced = useRef(false)
  const sphere = nodes.Sphere_Material002_0
  const material = materials['Material.002']

  useFrame((_state, delta) => {
    if (!reducedMotion && sunRef.current) {
      sunRef.current.rotation.y += SUN_ROTATION_RADIANS_PER_SECOND * delta
    }
  })

  if (!(sphere instanceof Mesh) || !material) throw new Error('Sun model is unavailable.')

  return (
    <group ref={sunRef} scale={0.0285} dispose={null}>
      <mesh
        geometry={sphere.geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={100}
        onAfterRender={() => {
          if (announced.current) return
          announced.current = true
          // Signal actual model rendering after both model and HDR resolve,
          // outside Fiber's render stack. No timer-based readiness shortcut.
          queueMicrotask(onReady)
        }}
      />
    </group>
  )
}

useGLTF.preload(SUN_MODEL_URL)
