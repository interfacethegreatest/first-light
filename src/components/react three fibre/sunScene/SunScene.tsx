import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useCalendarMotionPreferences } from '../../calendarMotion/useCalendarMotionPreferences'
import styles from './styles.module.css'

const Sun = lazy(() => import('./Sun'))

export default function SunScene() {
  const { reducedMotion } = useCalendarMotionPreferences()

  return (
    <Canvas
      className={styles.globeCanvas}
      data-testid="sun-scene"
      aria-hidden="true"
      frameloop={reducedMotion ? 'demand' : 'always'}
    >
      <ambientLight intensity={2} />
      <OrbitControls enableZoom={false} />
      <Suspense fallback={null}>
        <Sun />
      </Suspense>
      <Environment files={`${import.meta.env.BASE_URL}environments/venice_sunset_1k.hdr`} />
    </Canvas>
  )
}
