import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { animate, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import { motion } from '../calendarMotion/LightMotion'
import { useCalendarMotionPreferences } from '../calendarMotion/useCalendarMotionPreferences'

export type HeightSettlement = { immediate: boolean }

interface AnimatedHeightProps {
  children: ReactNode
  onSettled?: (settlement: HeightSettlement) => void
}

export default function AnimatedHeight({ children, onSettled }: AnimatedHeightProps) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | 'auto'>('auto')
  const overflow = useMotionValue<'hidden' | 'visible'>('visible')
  const { reducedMotion } = useCalendarMotionPreferences()
  const [focusRevision, setFocusRevision] = useState(0)
  const latestOnSettled = useRef(onSettled)
  const checkHeight = useRef<(() => void) | undefined>(undefined)
  const setupRan = useRef(false)

  useLayoutEffect(() => {
    latestOnSettled.current = onSettled
  }, [onSettled])

  useLayoutEffect(() => {
    setupRan.current = true
    const container = outer.current
    const content = inner.current
    if (!container || !content) return

    let controls: AnimationPlaybackControls | undefined
    let measuredHeight = content.offsetHeight
    let generation = 0
    let disposed = false
    const canAnimate = !reducedMotion && typeof ResizeObserver !== 'undefined'

    const releaseHeight = () => {
      height.set('auto')
      overflow.set('visible')
      container.style.height = 'auto'
      container.style.overflow = 'visible'
    }

    const notifySettled = (immediate: boolean) => {
      if (!disposed) latestOnSettled.current?.({ immediate })
    }

    const updateHeight = () => {
      if (disposed) return
      const nextHeight = content.offsetHeight

      // Keep observing focused content: removing a focused child need not
      // dispatch blur. Check the live DOM focus so later growth can resume.
      if (!canAnimate || container.contains(document.activeElement)) {
        measuredHeight = nextHeight
        generation++
        controls?.stop()
        controls = undefined
        releaseHeight()
        notifySettled(true)
        return
      }
      if (nextHeight === measuredHeight) {
        // An equal-size replacement may still have a pending reveal. Never
        // release it while an earlier growth animation is still running.
        if (!controls) {
          releaseHeight()
          notifySettled(false)
        }
        return
      }

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
        notifySettled(false)
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
          notifySettled(false)
        },
      })
    }

    checkHeight.current = updateHeight
    // First measurements and preference/focus changes settle immediately,
    // including the modes without an observer. They do not replay growth.
    releaseHeight()
    notifySettled(true)

    const observer = canAnimate ? new ResizeObserver(updateHeight) : undefined
    observer?.observe(content, { box: 'border-box' })
    return () => {
      disposed = true
      generation++
      observer?.disconnect()
      controls?.stop()
      if (checkHeight.current === updateHeight) checkHeight.current = undefined
      // Cleanup releases layout bounds, but cannot release a pending batch.
      releaseHeight()
    }
  }, [height, overflow, reducedMotion, focusRevision])

  useLayoutEffect(() => {
    // Setup already snapped/notified this commit. Otherwise measure children
    // before paint without resetting the previous intrinsic height baseline.
    if (setupRan.current) {
      setupRan.current = false
      return
    }
    checkHeight.current?.()
  }, [children, height, overflow, reducedMotion, focusRevision])

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
