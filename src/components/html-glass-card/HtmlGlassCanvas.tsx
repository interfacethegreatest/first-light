import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, type ComponentRef, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Html, MeshWobbleMaterial, RoundedBox, useEnvironment } from '@react-three/drei'
import GlassMaterial from '../glass-panel-3d/GlassMaterial'
import { moveHtmlHost } from './moveHtmlHost'

export interface HtmlGlassCanvasProps {
  host: HTMLDivElement
  nativeSlot: RefObject<HTMLDivElement | null>
  htmlPortal: RefObject<HTMLDivElement | null>
  cardWidth: number
  cardHeight: number
  animate: boolean
  onReady: () => void
  onUnavailable: () => void
}

const ZOOM = 100
const camera = { position: [0, 0, 6] as [number, number, number], zoom: ZOOM, near: .1, far: 50 }
const environmentUrl = `${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`

/** This slot contains a single persistent React portal, including native inputs. */
function HtmlMount({ host, nativeSlot, onAttached }: Pick<HtmlGlassCanvasProps, 'host' | 'nativeSlot'> & { onAttached: () => void }) {
  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!slot.current) return
    moveHtmlHost(host, slot.current)
    onAttached()
    return () => {
      if (nativeSlot.current) moveHtmlHost(host, nativeSlot.current)
      else host.remove()
    }
  }, [host, nativeSlot, onAttached])
  return <div ref={slot} data-html-scene-slot="" />
}

function WobbleAccent({ animate, x, y }: { animate: boolean; x: number; y: number }) {
  const material = useRef<ComponentRef<typeof MeshWobbleMaterial>>(null)
  useEffect(() => {
    const ownedMaterial = material.current
    return () => ownedMaterial?.dispose()
  }, [])
  return (
    <mesh name="html-glass-wobble-accent" position={[x, y, -.35]}>
      <torusGeometry args={[.58, .12, 16, 64]} />
      <MeshWobbleMaterial
        ref={material}
        color="#b0c9cb"
        factor={animate ? .08 : 0}
        speed={animate ? .45 : 0}
        roughness={.3}
        metalness={.15}
      />
    </mesh>
  )
}

function Scene({ host, nativeSlot, htmlPortal, cardWidth, cardHeight, animate, onReady }: Omit<HtmlGlassCanvasProps, 'onUnavailable'>) {
  const environment = useEnvironment({ files: environmentUrl })
  const scene = useThree(state => state.scene)
  const invalidate = useThree(state => state.invalidate)
  const size = useThree(state => state.size)
  const attached = useRef(false)
  const reported = useRef(false)
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])
  const onAttached = useCallback(() => { attached.current = true; invalidate() }, [invalidate])
  const onDrawn = useCallback(() => {
    if (!live.current || !attached.current || reported.current || scene.environment !== environment) return
    reported.current = true
    onReady()
  }, [environment, scene, onReady])
  const width = cardWidth / ZOOM
  const height = cardHeight / ZOOM

  return (
    <>
      <Environment map={environment} background={false} />
      <RoundedBox args={[width, height, .16]} radius={.06} smoothness={4} onAfterRender={onDrawn}>
        <GlassMaterial />
      </RoundedBox>
      <WobbleAccent animate={animate}
        x={Math.min(width / 2 - .12, size.width / ZOOM / 2 - .72)}
        y={Math.min(height / 2 - .45, size.height / ZOOM / 2 - .72)} />
      <Html
        portal={htmlPortal as RefObject<HTMLElement>}
        position={[0, 0, .2]}
        center
        transform
        distanceFactor={400 / ZOOM}
        occlude
        zIndexRange={[4, 0]}
        pointerEvents="auto"
      >
        <HtmlMount host={host} nativeSlot={nativeSlot} onAttached={onAttached} />
      </Html>
    </>
  )
}

export default function HtmlGlassCanvas(props: HtmlGlassCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const failureCallback = useRef(props.onUnavailable)
  useLayoutEffect(() => { failureCallback.current = props.onUnavailable }, [props.onUnavailable])
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const lost = (event: Event) => { event.preventDefault(); failureCallback.current() }
    element.addEventListener('webglcontextlost', lost)
    return () => element.removeEventListener('webglcontextlost', lost)
  }, [])

  return (
    <Canvas
      ref={canvas}
      data-testid="html-glass-canvas"
      orthographic
      camera={camera}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop={props.animate ? 'always' : 'demand'}
      onCreated={({ gl }) => { gl.domElement.setAttribute('aria-hidden', 'true') }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={.4} />
      <directionalLight position={[2, 3, 5]} intensity={1.5} />
      <Suspense fallback={null}><Scene {...props} /></Suspense>
    </Canvas>
  )
}
