import { Component, lazy, memo, Suspense, useCallback, useEffect, useRef, useState,
  type CSSProperties, type ReactNode } from 'react'
import { useContentPaintReady } from '../../performance/useContentPaintReady'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import { useMoonActivity } from '../MoonMark/useMoonActivity'
import type { SunRotationAxis } from './SunModel'
import SunFallback from './SunFallback'
import styles from './SunMark.module.css'

const SunMarkCanvas = lazy(() => import('./SunMarkCanvas'))

export interface SunMarkProps {
  /** Omit to fill the existing source-card badge. */
  size?: number
  animate?: boolean
  rotationAxis?: SunRotationAxis
  /** Radians/second; the original Sun speed is -0.45. */
  rotationSpeed?: number
  className?: string
}

class SunBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

function SunMark({ size, animate = true, rotationAxis = 'y', rotationSpeed = -0.45, className }: SunMarkProps) {
  const contentPainted = useContentPaintReady()
  const element = useRef<HTMLDivElement>(null)
  const live = useRef(true)
  const failed = useRef(false)
  const { inViewport, pageVisible, reducedMotion } = useMoonActivity(element)
  const { coarsePointer } = useCalendarMotionPreferences()
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    live.current = true
    setHasWebGL(typeof WebGL2RenderingContext !== 'undefined' || typeof WebGLRenderingContext !== 'undefined')
    return () => { live.current = false }
  }, [])
  useEffect(() => {
    if (contentPainted && inViewport && pageVisible && hasWebGL) setRequested(true)
  }, [contentPainted, inViewport, pageVisible, hasWebGL])
  useEffect(() => {
    if (!inViewport || !pageVisible) setReady(false)
  }, [inViewport, pageVisible])

  const onReady = useCallback(() => {
    if (live.current && !failed.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!live.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
  }, [])

  const canRender = requested && hasWebGL === true && inViewport && pageVisible && !unavailable
  const rotating = canRender && ready && animate && Number.isFinite(rotationSpeed) && rotationSpeed !== 0 && !reducedMotion
  const interactive = canRender && !coarsePointer
  const state = unavailable || hasWebGL === false
    ? 'unavailable' : ready && canRender ? 'loaded' : canRender ? 'loading' : 'pending'

  return (
    <div ref={element} className={`${styles.mark}${className ? ` ${className}` : ''}`}
      style={size === undefined ? undefined : { '--sun-mark-size': `${size}px` } as CSSProperties}
      aria-hidden="true" data-sun-mark data-sun-state={state} data-sun-animate={rotating}
      data-sun-interactive={interactive}>
      <div className={styles.visual} data-sun-visual>
        {state !== 'loaded' && <SunFallback />}
        {canRender && <SunBoundary onUnavailable={onUnavailable}>
          <Suspense fallback={null}>
            <SunMarkCanvas animate={rotating} interactive={interactive} rotationAxis={rotationAxis}
              rotationSpeed={rotationSpeed} onReady={onReady} onUnavailable={onUnavailable} />
          </Suspense>
        </SunBoundary>}
      </div>
    </div>
  )
}

export default memo(SunMark)
