import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMoonResolution } from '../MoonMark/useMoonResolution'
import SunModel, { type SunRotationAxis } from './SunModel'
import styles from './SunMark.module.css'

export interface SunMarkCanvasProps {
  animate?: boolean
  interactive?: boolean
  rotationAxis?: SunRotationAxis
  rotationSpeed?: number
  onReady?: () => void
  onUnavailable?: () => void
}

// Source radius 1 × 2.85, framed to match the previous 50px Sun badge.
const camera = { position: [0, 0, 10] as [number, number, number],
  left: -3.15, right: 3.15, top: 3.15, bottom: -3.15, near: 0.1, far: 30 }
const glOptions = { alpha: true, antialias: true, powerPreference: 'high-performance' as const }

export default function SunMarkCanvas({
  animate = false, interactive = false, rotationAxis = 'y', rotationSpeed = -0.45, onReady, onUnavailable,
}: SunMarkCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = useRef(true)
  const ready = useRef(false)
  const lost = useRef(false)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const [unavailable, setUnavailable] = useState(false)
  const dpr = useMoonResolution()
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
    if (!element || unavailable) return
    const contextLost = (event: Event) => {
      event.preventDefault()
      if (!live.current || lost.current) return
      lost.current = true
      setUnavailable(true)
      unavailableCallback.current?.()
    }
    element.addEventListener('webglcontextlost', contextLost)
    return () => element.removeEventListener('webglcontextlost', contextLost)
  }, [unavailable])

  if (unavailable) return null
  return (
    <Canvas ref={canvas} className={styles.canvas} data-testid="sun-scene" aria-hidden="true"
      orthographic camera={camera} gl={glOptions} dpr={dpr} frameloop={rotating ? 'always' : 'demand'}
      style={{ background: 'transparent', pointerEvents: interactive ? 'auto' : 'none', touchAction: 'pan-y', cursor: interactive ? 'grab' : 'auto' }}>
      <ambientLight intensity={2} />
      <hemisphereLight args={['#fff8ef', '#6c3824', 0.6]} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      {interactive && <OrbitControls enableZoom={false} enablePan={false} enableDamping={false} />}
      <Suspense fallback={null}>
        <SunModel animate={rotating} rotationAxis={rotationAxis} rotationSpeed={rotationSpeed} onReady={forwardReady} />
      </Suspense>
    </Canvas>
  )
}
