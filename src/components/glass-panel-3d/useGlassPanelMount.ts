import { useCallback, useState } from 'react'

/** Controls the GPU layer without remounting the panel's HTML children. */
export function useGlassPanelMount(initialMounted = true) {
  const [isMounted, setMounted] = useState(initialMounted)
  const mount = useCallback(() => setMounted(true), [])
  const unmount = useCallback(() => setMounted(false), [])
  const toggle = useCallback(() => setMounted(value => !value), [])

  return { isMounted, mount, unmount, toggle }
}
