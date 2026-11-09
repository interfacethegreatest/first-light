import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import MoonModel from './MoonModel'

interface MoonMarkCanvasProps {
  animate?: boolean
  onReady?: () => void
  onUnavailable?: () => void
}

// The source Moon's radius is about 2.8. These explicit bounds leave under
// 0.4% margin and make Fiber preserve the orthographic frustum on resize.
const camera = {
  position: [0, 0, 10] as [number, number, number],
  left: -2.81,
  right: 2.81,
  top: 2.81,
  bottom: -2.81,
  near: 0.1,
  far: 30,
}

export default function MoonMarkCanvas({
  animate = false,
  onReady,
  onUnavailable,
}: MoonMarkCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const reportedLoss = useRef(false)
  const [unavailable, setUnavailable] = useState(false)

  useLayoutEffect(() => {
    readyCallback.current = onReady
    unavailableCallback.current = onUnavailable
  }, [onReady, onUnavailable])

  const forwardReady = useCallback(() => {
    if (!reportedLoss.current) readyCallback.current?.()
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (unavailable || !element) return

    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (reportedLoss.current) return
      reportedLoss.current = true
      setUnavailable(true)
      unavailableCallback.current?.()
    }

    element.addEventListener('webglcontextlost', onContextLost)
    return () => element.removeEventListener('webglcontextlost', onContextLost)
  }, [unavailable])

  if (unavailable) return null

  return (
    <Canvas
      ref={canvas}
      data-testid="moon-scene"
      orthographic
      camera={camera}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      frameloop={animate ? 'always' : 'demand'}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        pointerEvents: 'none',
        touchAction: 'auto',
      }}
    >
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#808080', 0.6]} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <directionalLight position={[-4, -2, 1]} intensity={0.25} />
      <Suspense fallback={null}>
        <MoonModel animate={animate} onReady={forwardReady} />
      </Suspense>
    </Canvas>
  )
}
