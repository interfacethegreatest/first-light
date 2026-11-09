import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from 'react'
import MoonFallback from './MoonFallback'
import { useMoonActivity } from './useMoonActivity'
import styles from './MoonMark.module.css'

const MoonMarkCanvas = lazy(() => import('./MoonMarkCanvas'))

export interface MoonMarkProps {
  size?: number
  animate?: boolean
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

export default function MoonMark({ size = 36, animate = false, className }: MoonMarkProps) {
  const element = useRef<HTMLSpanElement>(null)
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
  const canAnimate = animate && inViewport && pageVisible && !reducedMotion
  const state = hasWebGL === false || unavailable
    ? 'fallback'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <span
      ref={element}
      className={`${styles.mark}${className ? ` ${className}` : ''}`}
      style={{ '--moon-mark-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
      data-moon-mark
      data-moon-state={state}
      data-moon-animate={Boolean(canRender && canAnimate)}
    >
      <span className={styles.visual} data-moon-visual>
        {!ready && <MoonFallback className={styles.fallback} />}
        {canRender && (
          <MoonBoundary onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <MoonMarkCanvas
                animate={canAnimate}
                onReady={onReady}
                onUnavailable={onUnavailable}
              />
            </Suspense>
          </MoonBoundary>
        )}
      </span>
    </span>
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
