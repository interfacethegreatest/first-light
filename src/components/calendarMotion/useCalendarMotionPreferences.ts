import { useEffect, useState } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const coarsePointerQuery = '(pointer: coarse)'

function matches(query: string) {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  )
}

export function useCalendarMotionPreferences() {
  const [preferences, setPreferences] = useState(() => ({
    reducedMotion: matches(reducedMotionQuery),
    coarsePointer: matches(coarsePointerQuery),
  }))

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const reducedMotion = window.matchMedia(reducedMotionQuery)
    const coarsePointer = window.matchMedia(coarsePointerQuery)
    const update = () =>
      setPreferences({
        reducedMotion: reducedMotion.matches,
        coarsePointer: coarsePointer.matches,
      })

    update()
    reducedMotion.addEventListener('change', update)
    coarsePointer.addEventListener('change', update)

    return () => {
      reducedMotion.removeEventListener('change', update)
      coarsePointer.removeEventListener('change', update)
    }
  }, [])

  return preferences
}
