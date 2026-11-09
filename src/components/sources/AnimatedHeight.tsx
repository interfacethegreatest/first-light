import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import { useCalendarMotionPreferences } from '../calendarMotion/useCalendarMotionPreferences'

export default function AnimatedHeight({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | 'auto'>('auto')
  const overflow = useMotionValue<'hidden' | 'visible'>('visible')
  const { reducedMotion } = useCalendarMotionPreferences()
  const [focusRevision, setFocusRevision] = useState(0)

  useLayoutEffect(() => {
    const container = outer.current
    const content = inner.current
    if (!container || !content) return

    let controls: AnimationPlaybackControls | undefined
    let measuredHeight = content.offsetHeight
    let generation = 0
    let disposed = false

    const releaseHeight = () => {
      height.set('auto')
      overflow.set('visible')
      container.style.height = 'auto'
      container.style.overflow = 'visible'
    }

    // First measurements, preference changes, and focused content settle
    // immediately. Do not replay growth when focus/reduced motion ends.
    releaseHeight()
    if (reducedMotion || typeof ResizeObserver === 'undefined') return

    const updateHeight = () => {
      if (disposed) return
      const nextHeight = content.offsetHeight

      // Keep observing focused content: removing a focused child need not
      // dispatch blur. Check the live DOM focus so later growth can resume.
      if (container.contains(document.activeElement)) {
        measuredHeight = nextHeight
        generation++
        controls?.stop()
        controls = undefined
        releaseHeight()
        return
      }
      if (nextHeight === measuredHeight) return

      // While idle, auto height has already adopted the new intrinsic size;
      // start from the previous measured size. During motion read the actual
      // current layout height, unaffected by the ancestor's tilt transform.
      const from = controls ? container.offsetHeight : measuredHeight
      measuredHeight = nextHeight
      const currentGeneration = ++generation
      controls?.stop()
      controls = undefined

      if (from === nextHeight) {
        releaseHeight()
        return
      }

      height.set(from)
      overflow.set('hidden')
      // Apply the initial bounds before the next paint, including when a
      // ResizeObserver callback follows an intrinsic async-content change.
      container.style.height = `${from}px`
      container.style.overflow = 'hidden'
      controls = animate(height, nextHeight, {
        duration: 0.3,
        ease: 'easeOut',
        onComplete: () => {
          if (disposed || currentGeneration !== generation) return
          if (content.offsetHeight !== measuredHeight) {
            updateHeight()
            return
          }
          controls = undefined
          releaseHeight()
        },
      })
    }

    const observer = new ResizeObserver(updateHeight)
    observer.observe(content, { box: 'border-box' })
    return () => {
      disposed = true
      generation++
      observer.disconnect()
      controls?.stop()
      releaseHeight()
    }
  }, [height, overflow, reducedMotion, focusRevision])

  return (
    <motion.div
      ref={outer}
      style={{ width: '100%', minWidth: 0, height, overflow }}
      onFocusCapture={() => setFocusRevision(revision => revision + 1)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusRevision(revision => revision + 1)
        }
      }}
    >
      <div ref={inner} style={{ display: 'flow-root', minWidth: 0 }}>
        {children}
      </div>
    </motion.div>
  )
}
