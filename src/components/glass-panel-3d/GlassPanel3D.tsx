import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type ComponentPropsWithRef, type ReactNode,
} from 'react'
import '../../styles/glass.css'
import styles from './GlassPanel3D.module.css'

const GlassPanelCanvas = lazy(() => import('./GlassPanelCanvas'))

export type GlassPanel3DProps = ComponentPropsWithRef<'div'> & {
  /** Mounts only the decorative GPU layer. HTML children always remain mounted. */
  mounted?: boolean
  contentClassName?: string
}

class GlassLayerBoundary extends Component<{
  children: ReactNode
  onUnavailable: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

/** Each explicit mount gets fresh readiness/error state and callback guards. */
function MountedGlassLayer() {
  const live = useRef(true)
  const failed = useRef(false)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    live.current = true
    setHasWebGL(
      typeof window.WebGL2RenderingContext !== 'undefined'
      || typeof window.WebGLRenderingContext !== 'undefined',
    )
    return () => { live.current = false }
  }, [])

  const onReady = useCallback(() => {
    if (live.current && !failed.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!live.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
  }, [])

  const state = unavailable || hasWebGL === false ? 'unavailable' : ready ? 'loaded' : 'loading'

  return (
    <div className={styles.visual} aria-hidden="true" data-glass-layer="" data-glass-state={state}>
      {hasWebGL && !unavailable && (
        <GlassLayerBoundary onUnavailable={onUnavailable}>
          <Suspense fallback={null}>
            <GlassPanelCanvas onReady={onReady} onUnavailable={onUnavailable} />
          </Suspense>
        </GlassLayerBoundary>
      )}
    </div>
  )
}

/** Native HTML content over a removable, static Three.js glass surface. */
export default function GlassPanel3D({
  mounted = true, children, className, contentClassName, ...props
}: GlassPanel3DProps) {
  return (
    <div
      {...props}
      className={[styles.panel, className].filter(Boolean).join(' ')}
      data-glass-panel=""
      data-glass-mounted={mounted}
    >
      {mounted && <MountedGlassLayer key="glass-layer" />}
      <div key="content" className={[styles.content, contentClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  )
}
