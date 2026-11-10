import type { ReactNode } from 'react'
import type { GlassSettings } from '../transmission/GlassPrimitives'
import type { RotationAxis } from './useObjectRotation'

export type GlassObjectKind = 'torus' | 'panel'

export interface GlassObjectCardProps {
  title?: string
  /** Native content in the surrounding header; never inserted into the scene. */
  children?: ReactNode
  initialSpin?: boolean
  initialRotationAxis?: RotationAxis
  /** Radians per second. A negative value reverses the spin. */
  initialRotationSpeed?: number
  initialMaterial?: Partial<GlassSettings>
  /** Multiplier for studio and local lights; 1 keeps the example's lighting. */
  lightingIntensity?: number
}

export interface GlassObjectCanvasProps {
  kind: GlassObjectKind
  settings: GlassSettings
  spin: boolean
  rotationAxis: RotationAxis
  rotationSpeed: number
  interactive: boolean
  coarse: boolean
  high: boolean
  lightingIntensity?: number
  onReady: () => void
  onUnavailable: (reason?: 'renderer' | 'context') => void
}
