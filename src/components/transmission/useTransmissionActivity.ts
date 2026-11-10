import { useEffect, useState, type RefObject } from 'react'

export function useTransmissionActivity(target: RefObject<HTMLDivElement | null>) {
  const [activity, setActivity] = useState({
    inView: false,
    pageVisible: true,
    reduced: true,
    coarse: true,
    webgl: null as boolean | null,
  })

  useEffect(() => {
    let live = true
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const pointer = window.matchMedia?.('(pointer: coarse)')
    const update = () => {
      if (!live) return
      setActivity(previous => ({
        ...previous,
        pageVisible: document.visibilityState !== 'hidden',
        reduced: motion?.matches ?? true,
        coarse: pointer?.matches ?? true,
        webgl: typeof window.WebGL2RenderingContext !== 'undefined'
          || typeof window.WebGLRenderingContext !== 'undefined',
      }))
    }
    const watch = (query: MediaQueryList | undefined) => {
      if (!query) return () => {}
      if (query.addEventListener) {
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
      }
      query.addListener(update)
      return () => query.removeListener(update)
    }
    const stopMotion = watch(motion)
    const stopPointer = watch(pointer)
    document.addEventListener('visibilitychange', update)
    update()

    const element = target.current
    const observer = element && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
          if (!live) return
          const entry = entries.find(value => value.target === element)
          if (entry) setActivity(previous => ({ ...previous, inView: entry.isIntersecting }))
        })
      : null
    if (observer && element) observer.observe(element)
    else setActivity(previous => ({ ...previous, inView: true }))

    return () => {
      live = false
      observer?.disconnect()
      stopMotion()
      stopPointer()
      document.removeEventListener('visibilitychange', update)
    }
  }, [target])

  return activity
}
