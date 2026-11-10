import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Center, ContactShadows, Float, Html, OrbitControls,
  RoundedBox, Text3D,
} from '@react-three/drei'
import {
  ACESFilmicToneMapping, OrthographicCamera, SRGBColorSpace,
  type Camera, type Group, type Scene, type WebGLRenderer,
} from 'three'
import { GlassSphere, GlassTorus, TransmissionSurface } from './GlassPrimitives'
import type { TransmissionCanvasProps } from './transmissionTypes'
import { TRANSMISSION_FONT_URL } from './transmissionAssets'
import { GlassStudioEnvironment } from './GlassStudioEnvironment'

function VolumeText({ variant, text, placement, textDepth, glassText, settings, animate }: TransmissionCanvasProps) {
  const fit = useRef<Group>(null)
  const invalidate = useThree(state => state.invalidate)
  const textSettings = useMemo(() => ({
    ...settings, thickness: 0.25, backside: false, distortion: 0.08,
  }), [settings])
  const onCentered = useCallback(({ width, height, depth }: { width: number; height: number; depth: number }) => {
    const diagonal = Math.hypot(width, height, depth)
    if (!fit.current || !Number.isFinite(width) || !Number.isFinite(diagonal) || width <= 0 || diagonal <= 0) return
    const scale = placement === 'inside' && variant === 'cinematic'
      ? Math.min(1, 1.65 / diagonal)
      : Math.min(1, (variant === 'panel' ? 4.6 : 3.8) / width)
    fit.current.scale.setScalar(scale)
    invalidate(3)
  }, [invalidate, placement, variant])
  const z = { behind: -1.65, inside: 0, intersecting: 0.3 }[placement] + textDepth

  return (
    <group position={[0, 0, z]}>
      <Float enabled={animate} autoInvalidate={false} speed={0.75}
        rotationIntensity={0.04} floatIntensity={0.35} floatingRange={[-0.05, 0.05]}>
        {/* Measure a fresh subtree at scale 1 after changing word/placement. */}
        <group key={`${variant}:${placement}:${text}`} ref={fit}>
          <Center onCentered={onCentered}>
            <Text3D font={TRANSMISSION_FONT_URL} size={0.72} height={0.28} curveSegments={12}
              bevelEnabled bevelThickness={0.025} bevelSize={0.018} bevelSegments={4}>
              {text}
              {glassText ? <TransmissionSurface settings={textSettings} animate={animate} />
                : <meshStandardMaterial color="#fff0e6" metalness={0.2} roughness={0.3} />}
            </Text3D>
          </Center>
        </group>
      </Float>
    </group>
  )
}

function SceneContents(props: TransmissionCanvasProps) {
  const { variant, settings, animate, interactive, coarse, high, onReady } = props
  const camera = useThree(state => state.camera)
  const size = useThree(state => state.size)
  const invalidate = useThree(state => state.invalidate)
  const reported = useRef(false)
  const designHeight = variant === 'panel' ? 5.6 : 6.1
  const zoom = Math.min(size.width / 7.6, size.height / designHeight)

  useLayoutEffect(() => {
    if (camera instanceof OrthographicCamera && Number.isFinite(zoom) && zoom > 0) {
      camera.zoom = zoom
      camera.updateProjectionMatrix()
      invalidate(3)
    }
  }, [camera, invalidate, zoom])
  useEffect(() => {
    // Finite settling allowance for separate buffers, not recursive convergence.
    invalidate(3)
  }, [invalidate, props.text, props.placement, props.textDepth, props.glassText, settings, animate])

  const reportMainDraw = useCallback((renderer: WebGLRenderer, _scene: Scene, renderedCamera: Camera) => {
    // Readiness excludes transmission and shadow render-target captures.
    if (reported.current || renderer.getRenderTarget() !== null || renderedCamera !== camera) return
    reported.current = true
    onReady()
  }, [camera, onReady])

  return (
    <>
      <color attach="background" args={['#080b14']} />
      <GlassStudioEnvironment />
      <VolumeText {...props} />
      {variant === 'panel' ? (
        <>
          <Float enabled={animate} autoInvalidate={false} speed={0.6}
            rotationIntensity={0.12} floatIntensity={0.3}>
            <RoundedBox name="transmission-rounded-panel" args={[6.3, 3.4, 0.42]}
              radius={0.18} smoothness={8} bevelSegments={8} rotation={[-0.12, 0.15, -0.01]}
              onAfterRender={reportMainDraw}>
              <TransmissionSurface settings={settings} animate={animate} />
            </RoundedBox>
          </Float>
          <GlassTorus name="transmission-torus" position={[-2.05, 0.65, -0.65]}
            rotation={[0.25, -0.35, 0.1]} scale={0.6} settings={settings} animate={animate} />
          <GlassSphere name="transmission-sphere" position={[2, 0.65, -0.65]}
            scale={0.6} settings={settings} animate={animate} />
        </>
      ) : (
        <Float enabled={animate} autoInvalidate={false} speed={0.65}
          rotationIntensity={0.18} floatIntensity={0.5} floatingRange={[-0.05, 0.05]}>
          <GlassSphere name="transmission-sphere" scale={1.1} settings={settings}
            animate={animate} onAfterRender={reportMainDraw} />
          <GlassTorus name="transmission-torus" position={[0, 0, 0.25]}
            rotation={[0.3, -0.35, 0.12]} scale={1.45} settings={settings} animate={animate} />
        </Float>
      )}

      {/* Opaque anchors and bars provide recognizable content to refract. */}
      <mesh position={[-2.2, -1.1, -1.1]} castShadow>
        <sphereGeometry args={[0.3, 48, 32]} />
        <meshPhysicalMaterial color="#d9ad72" metalness={0.35} roughness={0.28} clearcoat={0.6} />
      </mesh>
      <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.08} smoothness={4}
        position={[2.25, -0.9, -1]} rotation={[0.2, 0.4, 0.2]} castShadow>
        <meshStandardMaterial color="#596879" roughness={0.7} />
      </RoundedBox>
      {[0.75, -0.75].map((y, index) => (
        <mesh key={y} position={[0, y, -2]}>
          <boxGeometry args={[5.6, 0.07, 0.06]} />
          <meshStandardMaterial color={index ? '#ff9470' : '#b8e4ff'} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#03050a" roughness={1} envMapIntensity={0.05} />
      </mesh>
      {/* Only executes on scheduled frames; idle demand rendering stays settled. */}
      <ContactShadows position={[0, -2.05, 0]} opacity={0.25} scale={10}
        blur={2.5} far={6} resolution={high ? 256 : 128} />

      {/* Clear of glass: raycast occlusion treats transmission meshes as solid. */}
      <Html position={[0, 2.45, 1.5]} center transform occlude
        distanceFactor={400 / Math.max(zoom, 1)} style={{ pointerEvents: 'none' }}>
        <span className="transmission-annotation">FIRST LIGHT / TRANSMISSION</span>
      </Html>
      {!coarse && <OrbitControls makeDefault enabled={interactive} enableZoom={false}
        enablePan={false} enableDamping={false} minAzimuthAngle={-0.6} maxAzimuthAngle={0.6}
        minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.25}
        onEnd={() => invalidate(3)} />}
    </>
  )
}

export default function TransmissionCanvas(props: TransmissionCanvasProps) {
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
    <Canvas ref={canvas} data-testid="transmission-canvas" aria-hidden="true" orthographic shadows
      camera={{ position: [0, 0.6, 8], zoom: 70, near: 0.1, far: 40 }}
      dpr={[1, props.high ? 1.75 : 1.25]} gl={{ alpha: false, antialias: true }}
      frameloop={props.animate ? 'always' : 'demand'} style={{ touchAction: 'pan-y' }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.outputColorSpace = SRGBColorSpace
        gl.domElement.style.touchAction = 'pan-y'
        invalidate(3)
      }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={3.5} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 2, -4]} color="#b8ddff" intensity={4} />
      <pointLight position={[-4, 1, 1]} color="#ff9470" intensity={16} distance={9} />
      <Suspense fallback={null}><SceneContents {...props} /></Suspense>
    </Canvas>
  )
}
