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
const STAR_ROTATION_RADIANS_PER_SECOND = 0.015

function Model({ reducedMotion }: ModelProps) {
  const stars = useRef<Points>(null)

  useFrame((_state, delta) => {
    if (!reducedMotion && stars.current) {
      // Preserve the original 60 FPS pace and x following y at any frame rate.
      stars.current.rotation.x = stars.current.rotation.y += STAR_ROTATION_RADIANS_PER_SECOND * delta
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
