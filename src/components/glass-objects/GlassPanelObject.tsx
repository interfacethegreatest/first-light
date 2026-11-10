import { useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { DEFAULT_GLASS_SETTINGS, TransmissionSurface } from '../transmission/GlassPrimitives'
import type { ObjectProps } from './glassObjectTypes'
import { useObjectRotation } from './useObjectRotation'

export interface PanelProps extends ObjectProps {
  size?: [width: number, height: number, depth: number]
  radius?: number
}

const DEFAULT_PANEL_SIZE: [number, number, number] = [4.8, 3, 0.42]

/** One blank rounded panel; the outer group retains caller transforms/ref. */
export function GlassPanelObject({
  settings = DEFAULT_GLASS_SETTINGS,
  spin,
  rotationAxis,
  rotationSpeed,
  onRendered,
  size = DEFAULT_PANEL_SIZE,
  radius = 0.18,
  ...groupProps
}: PanelProps) {
  const rotation = useRef<Group>(null)
  useObjectRotation(rotation, { spin, rotationAxis, rotationSpeed })

  return (
    <group {...groupProps}>
      <group ref={rotation}>
        <RoundedBox args={size} radius={radius} smoothness={8} bevelSegments={8} onAfterRender={onRendered}>
          <TransmissionSurface settings={settings} animate={false} />
        </RoundedBox>
      </group>
    </group>
  )
}

export default GlassPanelObject
