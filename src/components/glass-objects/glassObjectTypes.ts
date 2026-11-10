import type { ThreeElements } from '@react-three/fiber'
import type { GlassSettings } from '../transmission/GlassPrimitives'
import type { ObjectRotationOptions } from './useObjectRotation'

export type ObjectProps = Omit<ThreeElements['group'], 'children' | 'onAfterRender'> & ObjectRotationOptions & {
  settings?: GlassSettings
  /** Mesh draw callback; the scene owner can exclude offscreen capture passes. */
  onRendered?: ThreeElements['mesh']['onAfterRender']
}

export type GlassObjectProps = ObjectProps
