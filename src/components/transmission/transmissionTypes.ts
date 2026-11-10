import type { GlassSettings } from './GlassPrimitives'

export type TransmissionVariant = 'panel' | 'cinematic'
export type TextPlacement = 'behind' | 'inside' | 'intersecting'
export type TransmissionQuality = 'auto' | 'balanced' | 'high'

export interface TransmissionCanvasProps {
  variant: TransmissionVariant
  text: string
  placement: TextPlacement
  textDepth: number
  glassText: boolean
  settings: GlassSettings
  animate: boolean
  interactive: boolean
  coarse: boolean
  high: boolean
  onReady: () => void
  onUnavailable: (reason?: 'renderer' | 'context') => void
}
