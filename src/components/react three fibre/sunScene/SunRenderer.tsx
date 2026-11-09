import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import Sun from './Sun'

interface SunRendererProps {
  reducedMotion: boolean
  onReady: () => void
  onFailure: () => void
}

function ContextGuard({ onFailure }: { onFailure: () => void }) {
  const canvas = useThree(state => state.gl.domElement)

  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault()
      onFailure()
    }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [canvas, onFailure])

  return null
}

export default function SunRenderer({ reducedMotion, onReady, onFailure }: SunRendererProps) {
  return (
    <Canvas
      frameloop={reducedMotion ? 'demand' : 'always'}
      fallback={null}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <ContextGuard onFailure={onFailure} />
      <Suspense fallback={null}>
        <ambientLight intensity={2} />
        <OrbitControls enableZoom={false} />
        <Sun reducedMotion={reducedMotion} onReady={onReady} />
        <Environment files={`${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`} />
      </Suspense>
    </Canvas>
  )
}
