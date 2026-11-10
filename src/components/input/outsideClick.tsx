import { useEffect, type RefObject } from 'react'

export type OutsideClickEvent = MouseEvent | TouchEvent

// Calendar4 outsideClick.tsx, blob f147b4208995724f1154f6827a1acfd9b65e6c72,
// with typed refs/targets and a conventional React hook name.
export default function useOutsideClick<Element extends Node>(
  ref: RefObject<Element | null>,
  handler: (event: OutsideClickEvent) => void,
) {
  useEffect(() => {
    function listener(event: OutsideClickEvent) {
      if (!ref.current || !(event.target instanceof Node) || ref.current.contains(event.target)) return
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler, ref])
}
