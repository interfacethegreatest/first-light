import { useContentPaintReady } from '../performance/useContentPaintReady'
import { Component, lazy, Suspense, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import HtmlGlassCardContent from './HtmlGlassCardContent'
import { moveHtmlHost } from './moveHtmlHost'
import { useHtmlSceneActivity } from './useHtmlSceneActivity'
import styles from './HtmlGlassCard.module.css'

const HtmlGlassCanvas = lazy(() => import('./HtmlGlassCanvas'))

export interface HtmlGlassCardProps {
  error?: boolean
  inputHeight?: number | null
  title?: string
  children?: ReactNode
  eyebrow?: string
  noteLabel?: string
  hint?: string
}

class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function HtmlGlassCard({
  error = false, inputHeight = 88, title = 'Hello from 3D.', children,
  eyebrow = 'HTML / THREE.JS', noteLabel = 'Scene research note',
  hint = 'Click or focus the field to see the Calendar4 highlight.',
}: HtmlGlassCardProps) {
  const contentPainted = useContentPaintReady()
  const root = useRef<HTMLDivElement>(null)
  const nativeSlot = useRef<HTMLDivElement>(null)
  const htmlPortal = useRef<HTMLDivElement>(null)
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('div')
    element.className = styles.host
    element.setAttribute('data-html-content-host', '')
    return element
  })
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const focusWithin = useRef(false)
  const lastFocused = useRef<HTMLElement | null>(null)
  const [cardWidth, setCardWidth] = useState(260)
  const [cardHeight, setCardHeight] = useState(300)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const live = useRef(true)
  const failed = useRef(false)
  const fieldId = useId()
  const activity = useHtmlSceneActivity(root)

  useLayoutEffect(() => {
    if (host && nativeSlot.current) moveHtmlHost(host, nativeSlot.current)
  }, [host])

  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => setCardWidth(Math.max(160, Math.min(520, element.clientWidth - 32)))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => { if (host) host.style.width = `${cardWidth}px` }, [host, cardWidth])

  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])
  useEffect(() => {
    if (contentPainted && activity.inViewport && activity.pageVisible && activity.hasWebGL) setRequested(true)
  }, [contentPainted, activity.inViewport, activity.pageVisible, activity.hasWebGL])

  const onReady = useCallback(() => { if (live.current && !failed.current) setReady(true) }, [])
  const onUnavailable = useCallback(() => {
    if (!live.current || failed.current) return
    failed.current = true
    setReady(false)
    setUnavailable(true)
    if (host && nativeSlot.current) moveHtmlHost(host, nativeSlot.current)
    // Html may detach its wrapper before an error boundary reports the failure.
    if (focusWithin.current && lastFocused.current?.isConnected) lastFocused.current.focus({ preventScroll: true })
  }, [host])
  const onFocusWithinChange = useCallback((next: boolean) => {
    focusWithin.current = next
    if (next) lastFocused.current = document.activeElement as HTMLElement | null
    setFocused(next)
  }, [])
  const onSize = useCallback((_width: number, height: number) => { if (height > 0) setCardHeight(height) }, [])

  const canRender = requested && activity.hasWebGL === true && !unavailable && host !== null
  const animate = canRender && ready && activity.inViewport && activity.pageVisible && !activity.reducedMotion && !focused
  const state = unavailable || activity.hasWebGL === false ? 'unavailable' : ready ? 'loaded' : requested ? 'loading' : 'pending'

  return (
    <div
      ref={root}
      className={styles.scene}
      style={{ height: Math.max(360, cardHeight + 80) }}
      data-html-glass-card=""
      data-html-state={state}
      data-html-animate={animate}
    >
      <div ref={nativeSlot} className={styles.nativeSlot} data-html-native-slot="" />
      {host && createPortal(
        <HtmlGlassCardContent
          fieldId={fieldId} value={value} onValueChange={setValue} error={error} inputHeight={inputHeight}
          onFocusWithinChange={onFocusWithinChange} onSize={onSize}
          title={title} eyebrow={eyebrow} noteLabel={noteLabel} hint={hint}
        >
          {children}
        </HtmlGlassCardContent>, host,
      )}
      {canRender && (
        <div className={styles.canvasLayer}>
          <SceneBoundary onUnavailable={onUnavailable}>
            <Suspense fallback={null}>
              <HtmlGlassCanvas host={host} nativeSlot={nativeSlot} htmlPortal={htmlPortal} cardWidth={cardWidth} cardHeight={cardHeight}
                animate={animate} onReady={onReady} onUnavailable={onUnavailable} />
            </Suspense>
          </SceneBoundary>
        </div>
      )}
      <div ref={htmlPortal} className={styles.htmlPortal} data-html-portal="" />
    </div>
  )
}
