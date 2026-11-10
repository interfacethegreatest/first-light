import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Center, Float, Text3D } from '@react-three/drei'
import type { OrthographicCamera } from 'three'

export const FOOTER_FONT_URL = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`

export interface FooterTextCanvasProps {
  text: string
  animate: boolean
  onReady?: () => void
  onUnavailable?: () => void
}

const cameraOptions = { position: [0, 0, 12] as [number, number, number], zoom: 40, near: 0.1, far: 100 }

function FittedText({ text, animate, onDrawn }: { text: string; animate: boolean; onDrawn: () => void }) {
  const camera = useThree(state => state.camera) as OrthographicCamera
  const width = useThree(state => state.size.width)
  const height = useThree(state => state.size.height)
  const invalidate = useThree(state => state.invalidate)
  const textSize = useRef<{ width: number; height: number } | null>(null)

  // Fit only after measurement or resize; no tween or frame subscription.
  const fit = useCallback(() => {
    if (!textSize.current || !camera.isOrthographicCamera) return
    const zoom = Math.min(width / (textSize.current.width * 1.15), height / (textSize.current.height * 1.15))
    if (!Number.isFinite(zoom) || zoom <= 0) return
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, width, height, invalidate])

  const onCentered = useCallback((size: { width: number; height: number }) => {
    textSize.current = { width: size.width, height: size.height }
    fit()
  }, [fit])

  useLayoutEffect(fit, [fit])

  return (
    <Center cacheKey={text} onCentered={onCentered}>
      <Float enabled={animate} autoInvalidate={false} speed={0.75} rotationIntensity={0.12} floatIntensity={0.65} floatingRange={[-0.05, 0.05]}>
        <Text3D
          font={FOOTER_FONT_URL}
          size={0.8}
          height={0.28}
          curveSegments={8}
          bevelEnabled
          bevelThickness={0.025}
          bevelSize={0.018}
          bevelSegments={3}
          rotation={[-0.14, -0.22, 0]}
          onAfterRender={onDrawn}
        >
          {text}
          <meshStandardMaterial attach="material-0" color="#f3f4f7" roughness={0.45} />
          <meshStandardMaterial attach="material-1" color="#ff9470" roughness={0.5} />
        </Text3D>
      </Float>
    </Center>
  )
}

export default function FooterTextCanvas({ text, animate, onReady, onUnavailable }: FooterTextCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const mounted = useRef(true)
  const drawn = useRef(false)
  const lost = useRef(false)
  const readyCallback = useRef(onReady)
  const unavailableCallback = useRef(onUnavailable)
  const [unavailable, setUnavailable] = useState(false)

  useLayoutEffect(() => {
    readyCallback.current = onReady
    unavailableCallback.current = onUnavailable
  }, [onReady, onUnavailable])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const reportDrawn = useCallback(() => {
    if (!mounted.current || lost.current || drawn.current) return
    drawn.current = true
    readyCallback.current?.()
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (unavailable || !element) return
    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!mounted.current || lost.current) return
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
      data-testid="footer-text-scene"
      aria-hidden="true"
      orthographic
      camera={cameraOptions}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop={animate ? 'always' : 'demand'}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none', touchAction: 'auto' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 6]} intensity={2} />
      <directionalLight position={[-4, -1, 2]} intensity={0.6} />
      <Suspense fallback={null}>
        <FittedText text={text} animate={animate} onDrawn={reportDrawn} />
      </Suspense>
    </Canvas>
  )
}
