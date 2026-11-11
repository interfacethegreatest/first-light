import { Component, lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Variants } from 'framer-motion'
import { motion } from '../../calendarMotion/LightMotion'
import { useContentPaintReady } from '../../performance/useContentPaintReady'
import Tilt from 'react-parallax-tilt'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import PaneBackground, { paneBackgroundClassName } from '../../panes/PaneBackground'
import CardTiles from './CardTiles'
import styles from './newUser.module.css'

const SunScene = lazy(() => import('../../react three fibre/sunScene/SunScene'))

class SunBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

interface NewUserCardProps {
  headingId: string
  title: string
  children: ReactNode
  controls?: ReactNode
  borderTone?: 'aliceblue' | 'slatepurple'
  surfaceClassName?: string
}

const frameVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
  settled: { transition: { staggerChildren: 0 } },
}

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  settled: { opacity: 1, y: 0, transition: { duration: 0 } },
}

// Keep transforms out of the badge variants: CSS centers it with translateX.
const badgeVariants: Variants = {
  hidden: { opacity: 0 },
  // An explicit delay replaces Framer's inherited stagger slot. Start after
  // the body (0.16s) while preserving the existing section DOM order.
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut', delay: 0.2 } },
  settled: { opacity: 1, transition: { duration: 0, delay: 0 } },
}

export default function NewUserCard({
  headingId,
  title,
  children,
  controls,
  borderTone = 'aliceblue',
  surfaceClassName,
}: NewUserCardProps) {
  const contentPainted = useContentPaintReady()
  const { reducedMotion, coarsePointer } = useCalendarMotionPreferences()
  const frame = useRef<HTMLDivElement>(null)
  const sunBadge = useRef<HTMLDivElement>(null)
  const [sunInView, setSunInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  const [insideParentTilt, setInsideParentTilt] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [settledOverride, setSettledOverride] = useState(reducedMotion)
  const tiltEnabled = !insideParentTilt && !reducedMotion && !coarsePointer && !focusWithin

  useLayoutEffect(() => {
    setInsideParentTilt(Boolean(frame.current?.parentElement?.closest('.calendar-panel-tilt')))
  }, [])

  useEffect(() => {
    if (reducedMotion) setSettledOverride(true)
  }, [reducedMotion])

  useEffect(() => {
    const element = sunBadge.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setSunInView(true)
      return
    }
    let live = true
    const observer = new IntersectionObserver(entries => {
      if (!live) return
      const entry = entries.find(value => value.target === element)
      if (entry) setSunInView(entry.isIntersecting)
    })
    observer.observe(element)
    return () => { live = false; observer.disconnect() }
  }, [])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return (
    <motion.div
      ref={frame}
      className={`${styles.frame}${reducedMotion ? ` ${styles.reduced}` : ''}`}
      variants={frameVariants}
      animate={reducedMotion || settledOverride ? 'settled' : undefined}
      onFocusCapture={() => {
        setFocusWithin(true)
        // Keep the settled label after blur so ancestor timing cannot replay.
        setSettledOverride(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false)
        }
      }}
    >
      <Tilt
        className={`${styles.tilt}${tiltEnabled ? '' : ` ${styles.steady}`}`}
        scale={1}
        tiltMaxAngleX={2}
        tiltMaxAngleY={2}
        tiltEnable={tiltEnabled}
        tiltAngleXManual={tiltEnabled ? null : 0}
        tiltAngleYManual={tiltEnabled ? null : 0}
      >
        <PaneBackground
          as="section"
          className={`${styles.main}${surfaceClassName ? ` ${surfaceClassName}` : ''}`}
          data-new-user-card
          aria-labelledby={headingId}
          data-border-tone={borderTone}
          style={{ width: '100%', minWidth: 0, height: 'auto', overflowWrap: 'anywhere' }}
        >
          <CardTiles reducedMotion={reducedMotion} />

          <motion.div className={styles.heading} variants={contentVariants}>
            <h3 id={headingId} className={styles.titleText}>{title}</h3>
            {controls && <div className={styles.controls}>{controls}</div>}
          </motion.div>

          <small className={styles.credit}>
            <a href="https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914" target="_blank" rel="noreferrer">Sun</a>
            {' by Akshat · '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          </small>

          <motion.div className={`${paneBackgroundClassName} ${styles.planetContainer}`} variants={badgeVariants} aria-hidden="true">
            <div ref={sunBadge} className={styles.planet} data-source-sun>
              <SunBoundary>
                {contentPainted && sunInView && pageVisible && <Suspense fallback={null}><SunScene /></Suspense>}
              </SunBoundary>
            </div>
          </motion.div>

          <motion.div className={`entry-form source-content ${styles.body}`} variants={contentVariants}>{children}</motion.div>
        </PaneBackground>
      </Tilt>
    </motion.div>
  )
}
