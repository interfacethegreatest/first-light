import {
  Component, lazy, Suspense, useCallback, useEffect, useId,
  useMemo, useRef, useState, type ReactNode,
} from 'react'
import { DEFAULT_GLASS_SETTINGS, type GlassSettings } from './GlassPrimitives'
import { useTransmissionActivity } from './useTransmissionActivity'
import { clearTransmissionAssetCache } from './transmissionAssets'
import type { TextPlacement, TransmissionQuality, TransmissionVariant } from './transmissionTypes'
import './GlassCards.css'

const TransmissionCanvas = lazy(() => import('./TransmissionCanvas'))

export interface TransmissionCardProps {
  title?: string
  initialText?: string
  children?: ReactNode
}

class SceneBoundary extends Component<{
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

function TransmissionCard({
  variant, title, initialText = 'GLASS', children,
}: TransmissionCardProps & { variant: TransmissionVariant }) {
  const id = useId()
  const stage = useRef<HTMLDivElement>(null)
  const activity = useTransmissionActivity(stage)
  const alive = useRef(true)
  const blocked = useRef(false)
  const epoch = useRef(0)
  const failureReason = useRef<'renderer' | 'context'>('renderer')
  const [attempt, setAttempt] = useState(0)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [word, setWord] = useState(initialText)
  const [placement, setPlacement] = useState<TextPlacement>('behind')
  const [textDepth, setTextDepth] = useState(0)
  const [glassText, setGlassText] = useState(false)
  const [quality, setQuality] = useState<TransmissionQuality>('auto')
  const [motion, setMotion] = useState(true)
  const [tuning, setTuning] = useState<GlassSettings>(() => ({ ...DEFAULT_GLASS_SETTINGS }))

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  useEffect(() => {
    if (activity.inView && activity.pageVisible && activity.webgl) setRequested(true)
  }, [activity.inView, activity.pageVisible, activity.webgl])

  const effectiveQuality = quality === 'auto'
    ? activity.coarse ? 'balanced' : 'high'
    : quality
  const high = effectiveQuality === 'high'
  const settings = useMemo(() => ({
    ...tuning,
    samples: high ? 6 : 4,
    resolution: high ? 512 : 256,
    backside: high,
  }), [tuning, high])

  const onReady = useCallback(() => {
    if (alive.current && epoch.current === attempt && !blocked.current) setReady(true)
  }, [attempt])
  const onUnavailable = useCallback((reason: 'renderer' | 'context' = 'renderer') => {
    if (!alive.current || epoch.current !== attempt || blocked.current) return
    blocked.current = true
    failureReason.current = reason
    setFailed(true)
    setReady(false)
  }, [attempt])
  const retry = () => {
    if (failed && failureReason.current !== 'context') clearTransmissionAssetCache()
    epoch.current += 1
    blocked.current = false
    setAttempt(epoch.current)
    setFailed(false)
    setReady(false)
  }

  const canRender = requested && activity.webgl === true && !failed
  const animate = canRender && ready && motion && activity.inView
    && activity.pageVisible && !activity.reduced && !focused
  const state = failed || activity.webgl === false
    ? 'unavailable'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <section className="transmission-card" aria-labelledby={`${id}-title`}
      data-transmission-state={state} data-transmission-animate={animate}
      data-transmission-variant={variant} data-transmission-quality={effectiveQuality}>
      <header className="transmission-heading">
        <p>FIRST LIGHT / GLASS STUDY</p>
        <h3 id={`${id}-title`}>{title ?? (variant === 'panel'
          ? 'Rounded transmission panel' : 'Cinematic refraction')}</h3>
        {children}
      </header>

      <div ref={stage} className="transmission-stage" data-transmission-stage="">
        {canRender && (
          <SceneBoundary key={attempt} onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <TransmissionCanvas variant={variant} text={word.trim().slice(0, 14) || 'GLASS'}
                placement={placement} textDepth={textDepth} glassText={glassText}
                settings={settings} animate={animate}
                interactive={activity.inView && activity.pageVisible && !focused}
                coarse={activity.coarse} high={high}
                onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <p className="transmission-status" role="status">
        {state === 'unavailable' ? '3D preview unavailable. Your settings are kept.'
          : state === 'loaded' ? 'Motion pauses while editing. Drag on desktop to rotate.'
            : state === 'pending' ? 'The 3D scene loads when it comes into view.'
              : 'Loading the local 3D scene…'}
      </p>

      <fieldset className="transmission-controls"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
        }}>
        <legend>Scene controls</legend>
        <label>Lettering
          <input value={word} maxLength={14} onChange={event => setWord(event.currentTarget.value)} />
        </label>
        <label>Text placement
          <select value={placement} onChange={event => setPlacement(event.currentTarget.value as TextPlacement)}>
            <option value="behind">Behind the glass</option>
            <option value="inside">Inside the glass</option>
            <option value="intersecting">Intersecting the surface</option>
          </select>
        </label>
        <label>Quality
          <select value={quality} onChange={event => setQuality(event.currentTarget.value as TransmissionQuality)}>
            <option value="auto">Automatic</option>
            <option value="balanced">Balanced / mobile</option>
            <option value="high">High / desktop</option>
          </select>
        </label>
        <label>Text depth offset: {textDepth.toFixed(2)}
          <input type="range" min={-0.8} max={0.8} step={0.01} value={textDepth}
            onChange={event => setTextDepth(Number(event.currentTarget.value))} />
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
          <input type="checkbox" checked={glassText} onChange={event => setGlassText(event.currentTarget.checked)} />
          Glass lettering
        </label>
        <label className="transmission-checkbox">
          <input type="checkbox" checked={motion} onChange={event => setMotion(event.currentTarget.checked)} />
          Gentle motion
        </label>
        <button type="button" onClick={retry}>{failed ? 'Retry 3D preview' : 'Reset 3D view'}</button>
      </fieldset>
    </section>
  )
}

export function RoundedTransmissionCard(props: TransmissionCardProps) {
  return <TransmissionCard {...props} variant="panel" />
}

export function CinematicTransmissionCard(props: TransmissionCardProps) {
  return <TransmissionCard {...props} variant="cinematic" />
}

export function TransmissionGallery() {
  const [variant, setVariant] = useState<TransmissionVariant>('panel')
  useEffect(() => {
    if (window.location.hash !== '#transmission-studies') return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('transmission-studies')?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  return (
    <section id="transmission-studies" className="transmission-gallery">
      <h2>Transmission studies</h2>
      <label className="transmission-selector">Card version
        <select value={variant} onChange={event => setVariant(event.currentTarget.value as TransmissionVariant)}>
          <option value="panel">Rounded glass panel</option>
          <option value="cinematic">Sphere, torus and 3D text</option>
        </select>
      </label>
      {/* A single active scene bounds the gallery's GPU context count. */}
      <TransmissionCard variant={variant} />
    </section>
  )
}
