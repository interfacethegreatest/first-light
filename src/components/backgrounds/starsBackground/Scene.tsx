import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import Model from './Model'

interface SceneProps {
  reducedMotion: boolean
}

export default function Scene({ reducedMotion }: SceneProps) {
  return (
    <Canvas
      frameloop={reducedMotion ? 'demand' : 'always'}
      fallback={null}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minHeight: '100%',
        pointerEvents: 'none',
      }}
    >
      <Suspense fallback={null}>
        <directionalLight intensity={3} position={[0, 3, 2]} />
        <Environment
          files={`${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`}
        />
        <Model reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  )
}
