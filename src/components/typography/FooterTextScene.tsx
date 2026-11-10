import {
  Component, lazy, Suspense, useCallback, useEffect, useRef, useState,
  type ReactNode,
} from 'react'
import { useFooterTextActivity } from './useFooterTextActivity'
import styles from './FooterTextScene.module.css'

const FooterTextCanvas = lazy(() => import('./FooterTextCanvas'))

export interface FooterTextSceneProps {
  text?: string
}

class FooterTextBoundary extends Component<{
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

export default function FooterTextScene({ text = 'Make learning tangible.' }: FooterTextSceneProps) {
  const element = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const failed = useRef(false)
  const { inViewport, pageVisible, reducedMotion, hasWebGL } = useFooterTextActivity(element)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (inViewport && pageVisible && hasWebGL) setRequested(true)
  }, [inViewport, pageVisible, hasWebGL])

  const onReady = useCallback(() => {
    if (mounted.current && !failed.current) setReady(true)
  }, [])
  const onUnavailable = useCallback(() => {
    if (!mounted.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
  }, [])

  const canRender = requested && hasWebGL === true && !unavailable
  const animate = canRender && inViewport && pageVisible && !reducedMotion
  const state = unavailable || hasWebGL === false
    ? 'unavailable'
    : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div
      ref={element}
      className={styles.scene}
      role="img"
      aria-label={text}
      data-footer-text-state={state}
      data-footer-text-animate={animate}
    >
      {!ready && <p className={styles.fallback} aria-hidden="true">{text}</p>}
      {canRender && (
        <FooterTextBoundary onUnavailable={onUnavailable}>
          <Suspense fallback={null}>
            <FooterTextCanvas text={text} animate={animate} onReady={onReady} onUnavailable={onUnavailable} />
          </Suspense>
        </FooterTextBoundary>
      )}
    </div>
  )
}
