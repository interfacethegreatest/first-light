import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Model from './Model'

interface SceneProps {
  reducedMotion: boolean
  pageVisible?: boolean
  editing?: boolean
}

export default function Scene({ reducedMotion, pageVisible = true, editing = false }: SceneProps) {
  const paused = reducedMotion || !pageVisible || editing
  return (
    <Canvas
      frameloop={paused ? 'demand' : 'always'}
      dpr={[1, 1.5]}
      gl={{ alpha: false, antialias: false }}
      flat
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
        <Model reducedMotion={paused} />
      </Suspense>
    </Canvas>
  )
}
