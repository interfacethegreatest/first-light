import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, RoundedBox, useEnvironment } from '@react-three/drei'
import GlassMaterial from './GlassMaterial'

export interface GlassPanelCanvasProps {
  onReady?: () => void
  onUnavailable?: () => void
}

export const GLASS_PANEL_ENVIRONMENT_URL = `${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`

const CAMERA_ZOOM = 100
const cameraOptions = {
  position: [0, 0, 5] as [number, number, number],
  zoom: CAMERA_ZOOM,
  near: 0.1,
  far: 50,
}

function GlassPanelMesh({ onDrawn }: { onDrawn: () => void }) {
  const width = useThree(state => state.size.width)
  const height = useThree(state => state.size.height)
  const scene = useThree(state => state.scene)
  // The HDR is shared with existing scenes. Environment's map form restores
  // this scene's environment without disposing the shared loader-cache texture.
  const environment = useEnvironment({ files: GLASS_PANEL_ENVIRONMENT_URL })
  const reportDrawn = useCallback(() => {
    if (scene.environment === environment) onDrawn()
  }, [scene, environment, onDrawn])
  const panelWidth = (width - 2) / CAMERA_ZOOM
  const panelHeight = (height - 2) / CAMERA_ZOOM
  const radius = Math.min(0.06, panelWidth / 4, panelHeight / 4)

  return (
    <>
      <Environment map={environment} background={false} />
      {panelWidth > 0 && panelHeight > 0 && (
        <RoundedBox
          name="glass-panel"
          args={[panelWidth, panelHeight, 0.16]}
          radius={radius}
          smoothness={4}
          bevelSegments={4}
          onAfterRender={reportDrawn}
        >
          <GlassMaterial />
        </RoundedBox>
      )}
    </>
  )
}

export default function GlassPanelCanvas({ onReady, onUnavailable }: GlassPanelCanvasProps) {
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
      data-testid="glass-panel-canvas"
      aria-hidden="true"
      orthographic
      camera={cameraOptions}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop="demand"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none', touchAction: 'auto' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 3, 5]} intensity={1.5} />
      <Suspense fallback={null}>
        <GlassPanelMesh onDrawn={reportDrawn} />
      </Suspense>
    </Canvas>
  )
}
