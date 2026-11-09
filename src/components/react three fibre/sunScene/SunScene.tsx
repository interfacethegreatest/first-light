import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import './sunScene.css'

// Keep Fiber, Drei, Three, and model loading out of the static badge path.
const SunRenderer = lazy(() => import('./SunRenderer'))

class SunBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFailure()
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
    && typeof window.WebGL2RenderingContext !== 'undefined'
    && typeof window.IntersectionObserver === 'function',
  )
  const [nearby, setNearby] = useState(false)
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document !== 'undefined' && document.visibilityState !== 'hidden',
  )
  const [failed, setFailed] = useState(false)
  const active = supported && nearby && pageVisible && !failed
  const renderToken = useMemo(() => Symbol('sun-render'), [active])
  const [readyToken, setReadyToken] = useState<symbol | null>(null)
  const ready = active && readyToken === renderToken
  const onReady = useCallback(() => setReadyToken(renderToken), [renderToken])
  const onFailure = useCallback(() => setFailed(true), [])

  useEffect(() => {
    if (!supported || !root.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setNearby(Boolean(entry?.isIntersecting)),
      { rootMargin: '32px', threshold: 0 },
    )
    observer.observe(root.current)
    return () => observer.disconnect()
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
      <span className="source-sun-scene__fallback">☀</span>
      {active && (
        <div className="source-sun-scene__renderer" style={{ opacity: ready ? 1 : 0 }}>
          <SunBoundary onFailure={onFailure}>
            <Suspense fallback={null}>
              <SunRenderer reducedMotion={reducedMotion} onReady={onReady} onFailure={onFailure} />
            </Suspense>
          </SunBoundary>
        </div>
      )}
    </div>
  )
}
