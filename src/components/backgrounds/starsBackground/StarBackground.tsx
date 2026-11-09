import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import Scene from './Scene'

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
  const reducedMotion = useReducedMotion()

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
        <Scene reducedMotion={reducedMotion} />
      </BackgroundBoundary>
    </div>
  )
}
