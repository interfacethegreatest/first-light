import {
  Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { DEFAULT_GLASS_SETTINGS, type GlassSettings } from '../transmission/GlassPrimitives'
import { useTransmissionActivity } from '../transmission/useTransmissionActivity'
import type { SceneObjectProps } from './GlassObjectCanvas'
import GlassTextObject, { type GlassTextBounds } from './GlassTextObject'
import styles from './GlassTextScene.module.css'

const GlassObjectCanvas = lazy(() => import('./GlassObjectCanvas'))

class TextSceneBoundary extends Component<{
  children: ReactNode
  onError: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

export interface GlassTextSceneProps {
  text?: string
  spin?: boolean
  /** Radians per second, with the same elapsed-time rotation as the torus. */
  rotationSpeed?: number
  material?: Partial<GlassSettings>
}

/** Drop-in native wrapper; its one text mesh shares the torus/panel material. */
export default function GlassTextScene({
  text = 'LIGHT', spin = false, rotationSpeed = 0.12, material,
}: GlassTextSceneProps) {
  const stage = useRef<HTMLDivElement>(null)
  const activity = useTransmissionActivity(stage)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [requested, setRequested] = useState(false)
  const [bounds, setBounds] = useState<GlassTextBounds | null>(null)
  const high = !activity.coarse
  const settings = useMemo(() => ({
    ...DEFAULT_GLASS_SETTINGS,
    // Shorter optical paths and less scattering clarify the existing glass shader.
    transmission: 1,
    color: '#e5ebf3',
    thickness: 0.22,
    ior: 1.45,
    roughness: 0.008,
    chromaticAberration: 0.015,
    anisotropicBlur: 0.012,
    distortion: 0.01,
    backsideThickness: 0.12,
    ...material,
    samples: high ? 6 : 4, resolution: high ? 512 : 256, backside: high,
  }), [high, material])
  const onReady = useCallback(() => setReady(true), [])
  const onUnavailable = useCallback(() => { setFailed(true); setReady(false) }, [])
  const onBounds = useCallback((value: GlassTextBounds) => setBounds(value), [])
  const renderObject = useCallback((props: SceneObjectProps) => (
    <GlassTextObject {...props} text={text} onBounds={onBounds}
      rotation={[-0.12, -0.25, 0]} name="standalone-glass-text" />
  ), [text, onBounds])
  const animate = spin && ready && !failed && !focused && activity.inView
    && activity.pageVisible && !activity.reduced
  const eligible = activity.inView && activity.pageVisible && activity.webgl
  // Retain the scene after its first visible request; hidden scenes use demand mode.
  useEffect(() => { if (eligible) setRequested(true) }, [eligible])
  const fitSize = bounds ? Math.hypot(bounds.width, bounds.height, bounds.depth) * 1.2 : 6.8

  return (
    <div ref={stage} className={styles.scene} role="img" aria-label={text}
      data-glass-text-state={failed || activity.webgl === false ? 'fallback' : ready ? 'loaded' : 'loading'}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
      }}>
      <span className={styles.fallback} aria-hidden="true" hidden={ready && !failed}>{text}</span>
      {requested && activity.webgl && !failed && (
        <TextSceneBoundary onError={onUnavailable}>
          <Suspense fallback={null}>
            <GlassObjectCanvas kind="panel" settings={settings} spin={animate}
              rotationAxis="y" rotationSpeed={rotationSpeed} interactive={false}
              coarse={activity.coarse} high={high} lightingIntensity={1.25}
              backdrop="dark"
              fitSize={fitSize} renderObject={renderObject}
              onReady={onReady} onUnavailable={onUnavailable} />
          </Suspense>
        </TextSceneBoundary>
      )}
    </div>
  )
}
