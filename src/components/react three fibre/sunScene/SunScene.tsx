import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import styles from './styles.module.css'

const Sun = lazy(() => import('./Sun'))

export default function SunScene() {
  const { reducedMotion } = useCalendarMotionPreferences()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [inViewport, setInViewport] = useState(false)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return
    }

    let live = true
    const observer = new IntersectionObserver(entries => {
      if (!live) return
      const entry = entries.find(value => value.target === element)
      if (entry) setInViewport(entry.isIntersecting)
    })
    observer.observe(element)
    return () => {
      live = false
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  const interactive = inViewport && pageVisible

  return (
    <Canvas
      ref={canvas}
      className={styles.globeCanvas}
      data-testid="sun-scene"
      aria-hidden="true"
      frameloop={interactive && !reducedMotion ? 'always' : 'demand'}
    >
      <ambientLight intensity={2} />
      <OrbitControls enableZoom={false} enabled={interactive} />
      <Suspense fallback={null}>
        <Sun />
      </Suspense>
      <Environment files={`${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`} />
    </Canvas>
  )
}
