import {
  Component, lazy, Suspense, useCallback, useEffect, useId,
  useMemo, useRef, useState, type ReactNode,
} from 'react'
import { DEFAULT_GLASS_SETTINGS, type GlassSettings } from '../transmission/GlassPrimitives'
import { useTransmissionActivity } from '../transmission/useTransmissionActivity'
import type { TransmissionQuality } from '../transmission/transmissionTypes'
import type { GlassObjectCardProps, GlassObjectKind } from './glassObjectSceneTypes'
import type { RotationAxis } from './useObjectRotation'
import '../transmission/GlassCards.css'
import './GlassObjectCards.css'

export type { GlassObjectCardProps } from './glassObjectSceneTypes'

const GlassObjectCanvas = lazy(() => import('./GlassObjectCanvas'))

class ObjectBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

const SLIDERS = [
  ['transmission', 'Transmission', 0, 1, 0.01],
  ['thickness', 'Thickness', 0.2, 1.5, 0.01],
  ['ior', 'Refraction index', 1.1, 1.8, 0.01],
  ['chromaticAberration', 'Chromatic aberration', 0, 0.1, 0.001],
  ['roughness', 'Roughness', 0, 0.25, 0.01],
] as const

function GlassObjectCard({
  kind, title, children, initialSpin = true, initialRotationAxis = 'y',
  initialRotationSpeed = 0.3, initialMaterial, lightingIntensity = 1,
}: GlassObjectCardProps & { kind: GlassObjectKind }) {
  const id = useId()
  const stage = useRef<HTMLDivElement>(null)
  const activity = useTransmissionActivity(stage)
  const alive = useRef(true)
  const blocked = useRef(false)
  const epoch = useRef(0)
  const [attempt, setAttempt] = useState(0)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [motion, setMotion] = useState(initialSpin)
  const [axis, setAxis] = useState<RotationAxis>(initialRotationAxis)
  const [speed, setSpeed] = useState(initialRotationSpeed)
  const [quality, setQuality] = useState<TransmissionQuality>('auto')
  const [tuning, setTuning] = useState<GlassSettings>(() => ({ ...DEFAULT_GLASS_SETTINGS, ...initialMaterial }))

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  useEffect(() => {
    if (activity.inView && activity.pageVisible && activity.webgl) setRequested(true)
  }, [activity.inView, activity.pageVisible, activity.webgl])

  const effectiveQuality = quality === 'auto' ? activity.coarse ? 'balanced' : 'high' : quality
  const high = effectiveQuality === 'high'
  const settings = useMemo(() => ({
    ...tuning, samples: high ? 6 : 4, resolution: high ? 512 : 256, backside: high,
  }), [tuning, high])
  const onReady = useCallback(() => {
    if (alive.current && epoch.current === attempt && !blocked.current) setReady(true)
  }, [attempt])
  const onUnavailable = useCallback(() => {
    if (!alive.current || epoch.current !== attempt || blocked.current) return
    blocked.current = true
    setFailed(true)
    setReady(false)
  }, [attempt])
  const retry = () => {
    epoch.current += 1
    blocked.current = false
    setAttempt(epoch.current)
    setFailed(false)
    setReady(false)
  }

  const canRender = requested && activity.webgl === true && !failed
  const spin = canRender && ready && motion && Number.isFinite(speed) && speed !== 0
    && activity.inView && activity.pageVisible && !activity.reduced && !focused
  const state = failed || activity.webgl === false
    ? 'unavailable' : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <section className="transmission-card glass-object-card" aria-labelledby={`${id}-title`}
      data-glass-object-state={state} data-glass-object-spin={spin}
      data-glass-object-kind={kind} data-glass-object-quality={effectiveQuality}
      data-glass-object-lighting={lightingIntensity}>
      <header className="transmission-heading">
        <p>FIRST LIGHT / GLASS OBJECT</p>
        <h3 id={`${id}-title`}>{title ?? (kind === 'torus' ? 'Spinning glass torus' : 'A single glass panel')}</h3>
        {children}
      </header>

      <div ref={stage} className="transmission-stage glass-object-stage" data-glass-object-stage="">
        {canRender && (
          <ObjectBoundary key={attempt} onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <GlassObjectCanvas kind={kind} settings={settings} spin={spin}
                rotationAxis={axis} rotationSpeed={speed}
                interactive={activity.inView && activity.pageVisible && !focused}
                coarse={activity.coarse} high={high} lightingIntensity={lightingIntensity}
                onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </ObjectBoundary>
        )}
      </div>

      <p className="transmission-status" role="status">
        {state === 'unavailable' ? '3D preview unavailable. Your settings are kept.'
          : state === 'pending' ? 'The object loads when it comes into view.'
            : state === 'loading' ? 'Loading the local glass scene…'
              : 'Spin pauses while editing, offscreen and with reduced motion. Drag on desktop to turn the view.'}
      </p>

      <fieldset className="transmission-controls glass-object-controls"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
        }}>
        <legend>Object controls</legend>
        <label>Rotation axis
          <select value={axis} onChange={event => setAxis(event.currentTarget.value as RotationAxis)}>
            <option value="x">X axis</option><option value="y">Y axis</option><option value="z">Z axis</option>
          </select>
        </label>
        <label>Rotation speed: {speed.toFixed(2)} rad/s
          <input type="range" min={-1} max={1} step={0.01} value={speed}
            onChange={event => setSpeed(Number(event.currentTarget.value))} />
        </label>
        <label>Quality
          <select value={quality} onChange={event => setQuality(event.currentTarget.value as TransmissionQuality)}>
            <option value="auto">Automatic</option>
            <option value="balanced">Balanced / mobile</option>
            <option value="high">High / desktop</option>
          </select>
        </label>
        {SLIDERS.map(([key, label, min, max, step]) => (
          <label key={key}>{label}: {tuning[key].toFixed(3)}
            <input type="range" min={min} max={max} step={step} value={tuning[key]}
              onChange={event => {
                const value = Number(event.currentTarget.value)
                setTuning(previous => ({ ...previous, [key]: value }))
              }} />
          </label>
        ))}
        <label className="transmission-checkbox">
          <input type="checkbox" checked={motion} onChange={event => setMotion(event.currentTarget.checked)} />Spin
        </label>
        <button type="button" onClick={retry}>{failed ? 'Retry 3D preview' : 'Reset 3D view'}</button>
      </fieldset>
    </section>
  )
}

/** Native card + one torus scene, ready to reuse outside this example. */
export function GlassTorusCard(props: GlassObjectCardProps) {
  return <GlassObjectCard {...props} kind="torus" />
}

/** Native card + one blank panel scene. No text or other meshes inside it. */
export function GlassPanelCard(props: GlassObjectCardProps) {
  return <GlassObjectCard {...props} kind="panel" />
}

export function GlassObjectGallery() {
  const [kind, setKind] = useState<GlassObjectKind>('torus')
  useEffect(() => {
    if (window.location.hash !== '#glass-objects') return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('glass-objects')?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  return (
    <section id="glass-objects" className="transmission-gallery glass-object-gallery">
      <h2>Individual glass objects</h2>
      <label className="transmission-selector">Glass object
        <select value={kind} onChange={event => setKind(event.currentTarget.value as GlassObjectKind)}>
          <option value="torus">Glass torus</option><option value="panel">Glass panel</option>
        </select>
      </label>
      {/* Switch only the mesh: one new canvas and the same native controls. */}
      <GlassObjectCard kind={kind} />
    </section>
  )
}
