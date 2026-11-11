import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type ComponentPropsWithRef, type ReactNode,
} from 'react'
import { useContentPaintReady } from '../performance/useContentPaintReady'
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
  const contentPainted = useContentPaintReady()
  const element = useRef<HTMLDivElement>(null)
  const live = useRef(true)
  const failed = useRef(false)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    if (!contentPainted || !hasWebGL || requested) return
    const target = element.current
    if (!target) return
    let live = true
    let inView = typeof IntersectionObserver === 'undefined'
    const activate = () => {
      if (live && inView && document.visibilityState !== 'hidden') setRequested(true)
    }
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
          const entry = entries.find(value => value.target === target)
          if (entry) inView = entry.isIntersecting
          activate()
        })
      : null
    observer?.observe(target)
    document.addEventListener('visibilitychange', activate)
    activate()
    // This stationary scene stays mounted once requested. Drop activation
    // observers then; demand rendering already needs no continuous callbacks.
    return () => {
      live = false
      observer?.disconnect()
      document.removeEventListener('visibilitychange', activate)
    }
  }, [contentPainted, hasWebGL, requested])

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

  const state = unavailable || hasWebGL === false ? 'unavailable' : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div ref={element} className={styles.visual} aria-hidden="true" data-glass-layer="" data-glass-state={state}>
      {requested && hasWebGL && !unavailable && (
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
