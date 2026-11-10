import { useEffect, useState, type RefObject } from 'react'

export function useFooterTextActivity(target: RefObject<HTMLElement | null>) {
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)

  useEffect(() => {
    setHasWebGL(typeof WebGL2RenderingContext !== 'undefined' || typeof WebGLRenderingContext !== 'undefined')
  }, [])

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

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return { inViewport, pageVisible, reducedMotion, hasWebGL }
}
