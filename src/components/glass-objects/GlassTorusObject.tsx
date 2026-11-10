import { useRef } from 'react'
import type { Group } from 'three'
import { DEFAULT_GLASS_SETTINGS, GlassTorus } from '../transmission/GlassPrimitives'
import type { ObjectProps } from './glassObjectTypes'
import { useObjectRotation } from './useObjectRotation'

/** One torus: 1.35 mesh scale gives a 3.618-unit outer diameter. */
export function GlassTorusObject({
  settings = DEFAULT_GLASS_SETTINGS,
  spin,
  rotationAxis,
  rotationSpeed,
  onRendered,
  ...groupProps
}: ObjectProps) {
  const rotation = useRef<Group>(null)
  useObjectRotation(rotation, { spin, rotationAxis, rotationSpeed })

  return (
    <group {...groupProps}>
      <group ref={rotation}>
        <GlassTorus settings={settings} scale={1.35} animate={false} onAfterRender={onRendered} />
      </group>
    </group>
  )
}

export default GlassTorusObject
