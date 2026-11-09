import { useEffect, useState, type RefObject } from 'react'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'

export function useMoonActivity(target: RefObject<HTMLElement | null>) {
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )
  const { reducedMotion } = useCalendarMotionPreferences()

  useEffect(() => {
    const element = target.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return
    }

    let disposed = false
    const observer = new IntersectionObserver(entries => {
      if (disposed) return
      const entry = entries.find(value => value.target === element)
      if (entry) setInViewport(entry.isIntersecting)
    })
    observer.observe(element)
    return () => {
      disposed = true
      observer.disconnect()
    }
  }, [target])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return { inViewport, pageVisible, reducedMotion }
}
