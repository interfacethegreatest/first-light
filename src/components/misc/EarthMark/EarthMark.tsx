import {
  Component, lazy, memo, Suspense, useCallback, useEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'
import { useMoonActivity } from '../MoonMark/useMoonActivity'
import type { EarthRotationAxis } from './EarthModel'
import EarthFallback from './EarthFallback'
import styles from './EarthMark.module.css'

const EarthMarkCanvas = lazy(() => import('./EarthMarkCanvas'))

export interface EarthMarkProps {
  size?: number
  animate?: boolean
  rotationAxis?: EarthRotationAxis
  /** Radians per second; negative values reverse direction and zero holds the pose. */
  rotationSpeed?: number
  className?: string
}

class EarthBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

function EarthMark({
  size = 14, animate = true, rotationAxis = 'y', rotationSpeed = -0.12, className,
}: EarthMarkProps) {
  const element = useRef<HTMLSpanElement>(null)
  const live = useRef(true)
  const failed = useRef(false)
  const { inViewport, pageVisible, reducedMotion } = useMoonActivity(element)
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
    if (inViewport && pageVisible && hasWebGL) setRequested(true)
  }, [inViewport, pageVisible, hasWebGL])

  const onReady = useCallback(() => {
    if (live.current && !failed.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!live.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
  }, [])

  const canRender = requested && hasWebGL === true && !unavailable
  const rotating = canRender && ready && animate && Number.isFinite(rotationSpeed) && rotationSpeed !== 0
    && inViewport && pageVisible && !reducedMotion
  const state = unavailable || hasWebGL === false
    ? 'unavailable' : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <span ref={element} className={`${styles.mark}${className ? ` ${className}` : ''}`}
      style={{ '--earth-mark-size': `${size}px` } as CSSProperties}
      aria-hidden="true" data-earth-mark data-earth-state={state} data-earth-animate={rotating}>
      <span className={styles.visual} data-earth-visual>
        {!ready && <EarthFallback />}
        {canRender && (
          <EarthBoundary onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <EarthMarkCanvas animate={rotating} rotationAxis={rotationAxis} rotationSpeed={rotationSpeed}
                onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </EarthBoundary>
        )}
      </span>
    </span>
  )
}

export default memo(EarthMark)

export function EarthCredit() {
  return (
    <span className={styles.credit}>
      <a href="https://sketchfab.com/3d-models/earth-f7a76c63ff1846afb2d606e5c8369c15" target="_blank" rel="noreferrer">Earth by PatelDev</a>
      {' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
      {' · packaged and adapted for First Light'}
    </span>
  )
}
