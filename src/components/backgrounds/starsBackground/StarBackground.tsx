import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { useContentPaintReady } from '../../performance/useContentPaintReady'

const Scene = lazy(() => import('./Scene'))

interface BoundaryProps {
  children: ReactNode
}

interface BoundaryState {
  failed: boolean
}

class BackgroundBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The decorative renderer must never take down the research workspace.
    // The parent layer already supplies the black fallback.
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export default function StarBackground() {
  const contentPainted = useContentPaintReady()
  const reducedMotion = useReducedMotion()
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  const [editing, setEditing] = useState(() => typeof document !== 'undefined' && isEditable(document.activeElement))
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    const visibility = () => setPageVisible(document.visibilityState !== 'hidden')
    const focus = (event: FocusEvent) => setEditing(isEditable(
      event.type === 'focusout' ? event.relatedTarget : event.target,
    ))
    visibility()
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('focusin', focus)
    document.addEventListener('focusout', focus)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('focusin', focus)
      document.removeEventListener('focusout', focus)
    }
  }, [])

  // Native content gets two paint opportunities before this optional GPU chunk.
  useEffect(() => {
    if (requested || !contentPainted || !pageVisible || editing) return
    let live = true
    let secondFrame: number | undefined
    let idle: number | undefined
    let timer: number | undefined
    const request = () => { if (live) setRequested(true) }
    const firstFrame = window.requestAnimationFrame(() => {
      if (!live) return
      secondFrame = window.requestAnimationFrame(() => {
        if (!live) return
        if (typeof window.requestIdleCallback === 'function') {
          idle = window.requestIdleCallback(request, { timeout: 1500 })
        } else {
          timer = window.setTimeout(request, 0)
        }
      })
    })
    return () => {
      live = false
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame)
      if (idle !== undefined) window.cancelIdleCallback?.(idle)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [requested, contentPainted, pageVisible, editing])

  return (
    <div
      data-testid="star-background"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <BackgroundBoundary>
        <Suspense fallback={null}>
          {requested && <Scene reducedMotion={reducedMotion} pageVisible={pageVisible} editing={editing} />}
        </Suspense>
      </BackgroundBoundary>
    </div>
  )
}

function isEditable(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
  ))
}
