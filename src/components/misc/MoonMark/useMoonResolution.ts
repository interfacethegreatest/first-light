import { useEffect, useState } from 'react'

const MAX_RENDERER_DPR = 4

function positiveFinite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1
}

function readResolution(): number {
  if (typeof window === 'undefined') return 1
  const device = Math.max(1, positiveFinite(window.devicePixelRatio))
  const pinch = Math.max(1, positiveFinite(window.visualViewport?.scale))
  // Desktop page zoom is already reflected in devicePixelRatio. Viewport
  // scale contributes mobile pinch zoom; no extra layout/window ratio is used.
  return Math.min(MAX_RENDERER_DPR, device * pinch)
}

/** Event-driven render-buffer resolution, without changing the source texture. */
export function useMoonResolution(): number {
  const [resolution, setResolution] = useState(readResolution)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const viewport = window.visualViewport
    let disposed = false
    let watchedDpr: number | undefined
    let removeMediaListener = () => {}

    function update() {
      if (disposed) return
      const next = readResolution()
      setResolution(current => current === next ? current : next)

      const dpr = positiveFinite(window.devicePixelRatio)
      if (dpr === watchedDpr) return
      removeMediaListener()
      removeMediaListener = () => {}
      watchedDpr = dpr
      if (typeof window.matchMedia !== 'function') return

      // Re-arm against the current DPR so moving between displays also works
      // when a browser reports that change without a window resize event.
      const media = window.matchMedia(`(resolution: ${dpr}dppx)`)
      const changed = () => {
        watchedDpr = undefined
        update()
      }
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', changed)
        removeMediaListener = () => media.removeEventListener('change', changed)
      } else if (typeof media.addListener === 'function') {
        media.addListener(changed)
        removeMediaListener = () => media.removeListener(changed)
      }
    }

    window.addEventListener('resize', update)
    viewport?.addEventListener?.('resize', update)
    update()
    return () => {
      disposed = true
      window.removeEventListener('resize', update)
      viewport?.removeEventListener?.('resize', update)
      removeMediaListener()
    }
  }, [])

  return resolution
}
