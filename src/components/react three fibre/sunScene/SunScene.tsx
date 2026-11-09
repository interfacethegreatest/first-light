import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import { SUN_PREVIEW_URL, clearSunAssetCache, preloadSunAssets } from './sunAssets'
import './sunScene.css'

const RETRY_DELAYS_MS = [600, 1600] as const

class SunBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    // Let the host commit its current generation before reporting an error.
    queueMicrotask(this.props.onFailure)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function SunScene() {
  const root = useRef<HTMLDivElement>(null)
  const { reducedMotion } = useCalendarMotionPreferences()
  const [supported] = useState(() =>
    typeof window !== 'undefined'
    && typeof window.WebGL2RenderingContext !== 'undefined',
  )
  const [nearby, setNearby] = useState(false)
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document !== 'undefined' && document.visibilityState !== 'hidden',
  )
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // A new lazy wrapper and boundary let transient renderer failures retry too.
  const SunRenderer = useMemo(() => lazy(() => import('./SunRenderer')), [attempt])
  const active = supported && nearby && pageVisible && !failed
  const renderToken = useMemo(() => Symbol('sun-render'), [active, attempt])
  const currentRender = useRef<symbol | null>(renderToken)
  const [readyToken, setReadyToken] = useState<symbol | null>(null)
  const ready = active && readyToken === renderToken

  useLayoutEffect(() => {
    currentRender.current = renderToken
    return () => { currentRender.current = null }
  }, [renderToken])

  const onReady = useCallback(() => {
    if (active && currentRender.current === renderToken) setReadyToken(renderToken)
  }, [active, renderToken])
  const onFailure = useCallback(() => {
    if (active && currentRender.current === renderToken) setFailed(true)
  }, [active, renderToken])

  useEffect(() => {
    if (!supported) return
    // Start the shared model/HDR warmup when the card mounts, including cards
    // outside the viewport. Warmup never changes a newer renderer's state;
    // actual render/load errors flow through its guarded boundary callback.
    void preloadSunAssets().catch(() => undefined)
  }, [supported, attempt])

  useEffect(() => {
    if (!failed || !supported || !nearby || !pageVisible || attempt >= RETRY_DELAYS_MS.length) return
    let cancelled = false
    const retry = window.setTimeout(() => {
      // Failure to import the cache helper also consumes this attempt. The
      // preview remains available if both automatic attempts are exhausted.
      void clearSunAssetCache().catch(() => undefined).then(() => {
        if (cancelled) return
        setAttempt(current => current + 1)
        setFailed(false)
      })
    }, RETRY_DELAYS_MS[attempt])
    return () => {
      cancelled = true
      window.clearTimeout(retry)
    }
  }, [failed, supported, nearby, pageVisible, attempt])

  useEffect(() => {
    if (!supported || !root.current) return
    if (typeof window.IntersectionObserver === 'function') {
      let observer: IntersectionObserver | undefined
      try {
        observer = new IntersectionObserver(
          ([entry]) => setNearby(Boolean(entry?.isIntersecting)),
          { rootMargin: '32px', threshold: 0 },
        )
        observer.observe(root.current)
        return () => observer?.disconnect()
      } catch {
        observer?.disconnect()
      }
    }

    // Older browsers still get the model, with simple viewport measurement
    // instead of treating a missing observer as a missing WebGL capability.
    const updateNearby = () => {
      const bounds = root.current?.getBoundingClientRect()
      setNearby(Boolean(bounds && bounds.bottom >= -32 && bounds.top <= window.innerHeight + 32
        && bounds.right >= -32 && bounds.left <= window.innerWidth + 32))
    }
    updateNearby()
    window.addEventListener('scroll', updateNearby, true)
    window.addEventListener('resize', updateNearby)
    return () => {
      window.removeEventListener('scroll', updateNearby, true)
      window.removeEventListener('resize', updateNearby)
    }
  }, [supported])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  const state = failed || !supported
    ? 'fallback'
    : !active ? 'inactive' : ready ? 'ready' : 'loading'

  return (
    <div
      ref={root}
      className="source-sun-scene"
      data-testid="sun-scene"
      data-sun-state={state}
      aria-hidden="true"
    >
      <img
        className="source-sun-scene__fallback"
        src={SUN_PREVIEW_URL}
        alt=""
        draggable={false}
        decoding="async"
      />
      {active && (
        <div className="source-sun-scene__renderer" style={{ opacity: ready ? 1 : 0 }}>
          <SunBoundary key={attempt} onFailure={onFailure}>
            <Suspense fallback={null}>
              <SunRenderer reducedMotion={reducedMotion} onReady={onReady} onFailure={onFailure} />
            </Suspense>
          </SunBoundary>
        </div>
      )}
    </div>
  )
}
