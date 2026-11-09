import { useEffect, useState, type ReactNode } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import { useCalendarMotionPreferences } from './useCalendarMotionPreferences'
import './calendarMotion.css'

export default function CalendarPanel({ children }: { children: ReactNode }) {
  const { reducedMotion, coarsePointer } = useCalendarMotionPreferences()
  const [focusWithin, setFocusWithin] = useState(false)
  const controls = useAnimationControls()
  const tiltEnabled = !reducedMotion && !coarsePointer && !focusWithin

  useEffect(() => {
    if (reducedMotion || focusWithin) {
      controls.stop()
      controls.set({ x: 0 })
    } else {
      // Starting again from the current x also supports StrictMode effect
      // replay. Preference changes never reset x to the off-screen position.
      void controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 70, damping: 20 },
      })
    }

    return () => controls.stop()
  }, [controls, reducedMotion, focusWithin])

  return (
    <motion.div
      className="calendar-panel-entrance"
      initial={{ x: reducedMotion ? 0 : '-100vw' }}
      animate={controls}
      data-calendar-focused={focusWithin}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false)
        }
      }}
    >
      <Tilt
        className={`calendar-panel-tilt${tiltEnabled ? '' : ' calendar-panel-tilt-steady'}`}
        scale={1}
        tiltMaxAngleX={2}
        tiltMaxAngleY={2}
        tiltEnable={tiltEnabled}
        tiltAngleXManual={tiltEnabled ? null : 0}
        tiltAngleYManual={tiltEnabled ? null : 0}
      >
        {children}
      </Tilt>
    </motion.div>
  )
}
