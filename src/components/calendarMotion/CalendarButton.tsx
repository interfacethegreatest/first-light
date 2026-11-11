import { useEffect, type ReactNode } from 'react'
import {
  animate,
  useMotionTemplate,
  useMotionValue,
  type HTMLMotionProps,
} from 'framer-motion'
import { motion } from './LightMotion'
import { useCalendarMotionPreferences } from './useCalendarMotionPreferences'
import './calendarMotion.css'

type CalendarButtonProps = Omit<
  HTMLMotionProps<'button'>,
  'children' | 'aria-label'
> & {
  label: string
  hoverLabel: string
  icon?: ReactNode
}

// The four colors and cycle settings are copied from Calendar4's auth buttons.
const COLOURS = [
  'rgba(159, 158, 158, 0.7)',
  'rgba(159, 158, 158, 0.5)',
  'rgba(130, 129, 129, 0.35)',
  'rgba(189, 188, 188, 0.2)',
]

export default function CalendarButton({
  label,
  hoverLabel,
  icon,
  className,
  style,
  disabled,
  type = 'button',
  ...props
}: CalendarButtonProps) {
  const { reducedMotion } = useCalendarMotionPreferences()
  const colour = useMotionValue(COLOURS[0])
  const border = useMotionTemplate`2px solid ${colour}`

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
    <motion.button
      {...props}
      className={`${className || ''} calendar-motion-button`.trim()}
      type={type}
      disabled={disabled}
      aria-label={label}
      data-calendar-reduced-motion={reducedMotion}
      style={{ ...style, border }}
    >
      <span className="calendar-button-labels" aria-hidden="true">
        <span className="calendar-button-default">{label}</span>
        <span className="calendar-button-hover">
          {icon}
          {hoverLabel}
        </span>
      </span>
    </motion.button>
  )
}
