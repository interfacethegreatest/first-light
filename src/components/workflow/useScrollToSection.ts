import { useCallback, useEffect, useState } from 'react'

export default function useScrollToSection(targetId: string, beforeNavigate?: () => void) {
  const [request, setRequest] = useState(0)

  useEffect(() => {
    if (!request) return

    // A reveal callback may have mounted the target in this React commit.
    const target = document.getElementById(targetId)
    if (!target) {
      setRequest(0)
      return
    }

    target.focus({ preventScroll: true })
    const frame = window.requestAnimationFrame(() => {
      if (target.isConnected) {
        const reducedMotion = typeof window.matchMedia === 'function'
          && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
          inline: 'nearest',
        })
      }
      setRequest(0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [request, targetId])

  return useCallback(() => {
    beforeNavigate?.()
    setRequest(current => current + 1)
  }, [beforeNavigate])
}
