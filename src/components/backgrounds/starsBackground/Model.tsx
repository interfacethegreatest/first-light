import { memo, useRef } from 'react'
import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { Points } from 'three'

interface ModelProps {
  reducedMotion: boolean
}

// Keep the original prop without changing Drei's star shader. In the source
// version this extra Points property does not set the shader's star colors.
const sourceStarProps = { color: 'red' }

function Model({ reducedMotion }: ModelProps) {
  const stars = useRef<Points>(null)

  useFrame(() => {
    if (!reducedMotion && stars.current) {
      // Preserve Calendar4's frame-based increment, including x following y.
      stars.current.rotation.x = stars.current.rotation.y += 0.00025
    }
  })

  return (
    <group>
      <mesh>
        <ambientLight intensity={1} />
        {/* The optional shooting star remains disabled, as in Calendar4. */}
        <Stars
          {...sourceStarProps}
          radius={200}
          count={7500}
          factor={4}
          fade
          ref={stars}
        />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} />
        </EffectComposer>
      </mesh>
    </group>
  )
}

export default memo(Model)
