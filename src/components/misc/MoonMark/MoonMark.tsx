import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'
import { useMoonActivity } from './useMoonActivity'
import type { MoonRotationAxis } from './MoonModel'
import styles from './MoonMark.module.css'

const MoonMarkCanvas = lazy(() => import('./MoonMarkCanvas'))

export interface MoonMarkProps {
  size?: number
  animate?: boolean
  /** Axis in the Moon's parent group; keeps the source mesh orientation intact. */
  rotationAxis?: MoonRotationAxis
  /** Radians per second. The sign sets the direction; zero holds the angle. */
  rotationSpeed?: number
  className?: string
}

class MoonBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onUnavailable()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function MoonMark({
  size = 112, animate = false, rotationAxis, rotationSpeed, className,
}: MoonMarkProps) {
  const element = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const { inViewport, pageVisible, reducedMotion } = useMoonActivity(element)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    mounted.current = true
    setHasWebGL(
      typeof WebGL2RenderingContext !== 'undefined' ||
      typeof WebGLRenderingContext !== 'undefined',
    )
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (inViewport && pageVisible && hasWebGL) setRequested(true)
  }, [inViewport, pageVisible, hasWebGL])

  const onReady = useCallback(() => {
    if (mounted.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!mounted.current) return
    setReady(false)
    setUnavailable(true)
  }, [])

  const canRender = requested && hasWebGL && !unavailable
  const canAnimate = animate && rotationSpeed !== 0 && inViewport && pageVisible && !reducedMotion
  const state = hasWebGL === false || unavailable
    ? 'unavailable'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div
      ref={element}
      className={`${styles.mark}${className ? ` ${className}` : ''}`}
      style={{ '--moon-mark-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
      data-moon-mark
      data-moon-state={state}
      data-moon-animate={Boolean(canRender && canAnimate)}
    >
      <div className={styles.visual} data-moon-visual>
        {canRender && (
          <MoonBoundary onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <MoonMarkCanvas
                animate={canAnimate}
                rotationAxis={rotationAxis}
                rotationSpeed={rotationSpeed}
                onReady={onReady}
                onUnavailable={onUnavailable}
              />
            </Suspense>
          </MoonBoundary>
        )}
      </div>
    </div>
  )
}

export function MoonCredit() {
  return (
    <span className={styles.credit}>
      <a href="https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f" target="_blank" rel="noreferrer">Moon by MaggaModels</a>
      {' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
      {' · packaged and adapted for First Light'}
    </span>
  )
}
