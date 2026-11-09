import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import SunScene from '../../react three fibre/sunScene/SunScene'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import '@fontsource/poppins/latin-600.css'
import styles from './newUser.module.css'

interface NewUserCardProps {
  headingId: string
  title: string
  children: ReactNode
  controls?: ReactNode
  borderTone?: 'aliceblue' | 'slatepurple'
}

const tileNames = [
  'tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6', 'tile7',
  'tile9', 'tile10', 'tile12', 'tile13', 'tile15',
] as const
const loaderNames = ['loader', 'loader2', 'loader3', 'loader4', 'loader5', 'loader6'] as const

const COLOURS = [
  'rgba(159, 158, 158, 0.7)',
  'rgba(159, 158, 158, 0.5)',
  'rgba(130, 129, 129, 0.35)',
  'rgba(189, 188, 188, 0.2)',
  'rgba(159, 158, 158, 0.17)',
]

export default function NewUserCard({
  headingId,
  title,
  children,
  controls,
  borderTone = 'aliceblue',
}: NewUserCardProps) {
  const { reducedMotion, coarsePointer } = useCalendarMotionPreferences()
  const colour = useMotionValue(COLOURS[0])
  const border = useMotionTemplate`2px solid ${colour}`
  const frame = useRef<HTMLDivElement>(null)
  const [insideParentTilt, setInsideParentTilt] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const tiltEnabled = !insideParentTilt && !reducedMotion && !coarsePointer && !focusWithin

  useLayoutEffect(() => {
    setInsideParentTilt(Boolean(frame.current?.parentElement?.closest('.calendar-panel-tilt')))
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      colour.set(COLOURS[0])
      return
    }

    const controls = animate(colour, COLOURS, {
      ease: 'easeInOut',
      duration: 10,
      repeat: Infinity,
      repeatType: 'mirror',
    })
    return () => controls.stop()
  }, [colour, reducedMotion])

  return (
    <div
      ref={frame}
      className={`${styles.frame}${reducedMotion ? ` ${styles.reduced}` : ''}`}
      onFocusCapture={() => setFocusWithin(true)}
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
        <motion.section
          className={styles.main}
          aria-labelledby={headingId}
          data-border-tone={borderTone}
          style={{ width: '100%', minWidth: 0, height: 'auto', overflowWrap: 'anywhere', border }}
        >
          <div className={styles.tiles} aria-hidden="true">
            {tileNames.map(name => <div key={name} className={styles[name]} />)}
            {loaderNames.map(name => <div key={name} className={styles[name]} />)}
          </div>

          <div className={styles.heading}>
            <h3 id={headingId} className={styles.titleText}>{title}</h3>
            {controls && <div className={styles.controls}>{controls}</div>}
          </div>

          <small className={styles.credit}>
            <a href="https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914" target="_blank" rel="noreferrer">Sun</a>
            {' by Akshat · '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          </small>

          <div className={styles.planetContainer} aria-hidden="true">
            <div className={styles.planet}><SunScene /></div>
          </div>

          <div className={`entry-form source-content ${styles.body}`}>{children}</div>
        </motion.section>
      </Tilt>
    </div>
  )
}
