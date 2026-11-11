import { Suspense, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  ACESFilmicToneMapping, OrthographicCamera, SRGBColorSpace,
  type Camera, type Mesh, type Scene, type WebGLRenderer,
} from 'three'
import { GlassStudioEnvironment } from '../transmission/GlassStudioEnvironment'
import GlassTorusObject from './GlassTorusObject'
import GlassPanelObject from './GlassPanelObject'
import GlassCaptureBackdrop from './GlassCaptureBackdrop'
import type { GlassObjectCanvasProps } from './glassObjectSceneTypes'

function ObjectScene(props: GlassObjectCanvasProps) {
  const { kind, settings, spin, rotationAxis, rotationSpeed, interactive, coarse, onReady } = props
  const camera = useThree(state => state.camera)
  const size = useThree(state => state.size)
  const invalidate = useThree(state => state.invalidate)
  const reported = useRef(false)
  // Fit a bounding sphere rather than the front face, so every spin axis fits.
  const designSize = kind === 'torus' ? 4.6 : 6.8
  const zoom = Math.min(size.width, size.height) / designSize

  useLayoutEffect(() => {
    reported.current = false
    if (camera instanceof OrthographicCamera && Number.isFinite(zoom) && zoom > 0) {
      camera.zoom = zoom
      camera.updateProjectionMatrix()
      invalidate(3)
    }
  }, [camera, invalidate, kind, zoom])
  useEffect(() => {
    // Finite refresh for optical/camera changes; no recursive idle invalidation.
    invalidate(3)
  }, [invalidate, settings, spin, rotationAxis, rotationSpeed, props.lightingIntensity])

  const reportMainDraw = useCallback((renderer: WebGLRenderer, scene: Scene, renderedCamera: Camera) => {
    if (reported.current || renderer.getRenderTarget() !== null || renderedCamera !== camera) return
    reported.current = true
    const meshes: Mesh[] = []
    scene.traverse(object => {
      if ((object as Mesh).isMesh && object.visible) meshes.push(object as Mesh)
    })
    // Diagnostics describe the real scene after its first main draw, not a mock.
    const canvas = renderer.domElement
    canvas.dataset.glassObjectMeshCount = String(meshes.length)
    canvas.dataset.glassObjectGeometry = meshes[0]?.geometry.type ?? ''
    const geometry = meshes[0]?.geometry
    canvas.dataset.glassObjectTriangles = String(geometry
      ? (geometry.index?.count ?? geometry.attributes.position.count) / 3 : 0)
    onReady()
  }, [camera, onReady])

  const objectProps = { settings, spin, rotationAxis, rotationSpeed, onRendered: reportMainDraw }
  return (
    <>
      {props.backdrop === 'neutral'
        ? <GlassCaptureBackdrop /> : <color attach="background" args={['#080b14']} />}
      <GlassStudioEnvironment intensity={props.lightingIntensity} />
      {/* Exactly one visible mesh. No text, tags, shadow planes or extra shapes. */}
      {kind === 'torus'
        ? <GlassTorusObject {...objectProps} name="isolated-glass-torus" />
        : <GlassPanelObject {...objectProps} name="isolated-glass-panel" />}
      {!coarse && <OrbitControls makeDefault enabled={interactive}
        enableZoom={false} enablePan={false} enableDamping={false}
        minAzimuthAngle={-0.6} maxAzimuthAngle={0.6}
        minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.25}
        onEnd={() => invalidate(3)} />}
    </>
  )
}

/** One renderer for one isolated object. The surrounding card owns its activity. */
export default function GlassObjectCanvas(props: GlassObjectCanvasProps) {
  const lightingIntensity = props.lightingIntensity ?? 1
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let live = true
    const lost = (event: Event) => {
      event.preventDefault()
      if (live) props.onUnavailable('context')
    }
    element.addEventListener('webglcontextlost', lost)
    return () => {
      live = false
      element.removeEventListener('webglcontextlost', lost)
    }
  }, [props.onUnavailable])

  return (
    <Canvas ref={canvas} data-testid="glass-object-canvas" data-glass-environment="studio-lights"
      aria-hidden="true" orthographic
      camera={{ position: [0, 0.35, 8], zoom: 70, near: 0.1, far: 40 }}
      dpr={[1, props.high ? 1.75 : 1.25]} gl={{ alpha: false, antialias: true }}
      frameloop={props.spin ? 'always' : 'demand'} style={{ touchAction: 'pan-y' }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.outputColorSpace = SRGBColorSpace
        gl.domElement.style.touchAction = 'pan-y'
        invalidate(3)
      }}>
      <ambientLight intensity={0.7 * lightingIntensity} />
      <directionalLight position={[3, 5, 6]} intensity={3.5 * lightingIntensity} />
      <directionalLight position={[-3, 2, -4]} color="#b8ddff" intensity={4 * lightingIntensity} />
      <pointLight position={[-4, 1, 1]} color="#ff9470" intensity={16 * lightingIntensity} distance={9} />
      <Suspense fallback={null}><ObjectScene {...props} /></Suspense>
    </Canvas>
  )
}
