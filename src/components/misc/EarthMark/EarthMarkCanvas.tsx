import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import EarthModel, { type EarthRotationAxis } from './EarthModel'

export interface EarthMarkCanvasProps {
  animate?: boolean
  rotationAxis?: EarthRotationAxis
  rotationSpeed?: number
  onReady?: () => void
  onUnavailable?: () => void
}

const camera = {
  position: [0, 0, 10] as [number, number, number],
  left: -2.81,
  right: 2.81,
  top: 2.81,
  bottom: -2.81,
  near: 0.1,
  far: 30,
}
const dpr: [number, number] = [1, 1.5]
const glOptions = { alpha: true, antialias: true }

export default function EarthMarkCanvas({
  animate = false,
  rotationAxis = 'y',
  rotationSpeed = -0.12,
  onReady,
  onUnavailable,
}: EarthMarkCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = useRef(true)
  const ready = useRef(false)
  const lost = useRef(false)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const [unavailable, setUnavailable] = useState(false)
  const rotating = animate && Number.isFinite(rotationSpeed) && rotationSpeed !== 0

  useLayoutEffect(() => {
    readyCallback.current = onReady
    unavailableCallback.current = onUnavailable
  }, [onReady, onUnavailable])
  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])

  const forwardReady = useCallback(() => {
    if (!live.current || lost.current || ready.current) return
    ready.current = true
    readyCallback.current?.()
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (unavailable || !element) return
    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!live.current || lost.current) return
      lost.current = true
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
      data-testid="earth-scene"
      aria-hidden="true"
      orthographic
      camera={camera}
      gl={glOptions}
      dpr={dpr}
      frameloop={rotating ? 'always' : 'demand'}
      style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none', touchAction: 'auto' }}
    >
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#808080', 0.6]} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <directionalLight position={[-4, -2, 1]} intensity={0.25} />
      <Suspense fallback={null}>
        <EarthModel animate={rotating} rotationAxis={rotationAxis} rotationSpeed={rotationSpeed} onReady={forwardReady} />
      </Suspense>
    </Canvas>
  )
}
