import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

export type RotationAxis = 'x' | 'y' | 'z'

export interface ObjectRotationOptions {
  spin?: boolean
  rotationAxis?: RotationAxis
  /** Radians per second; negative values reverse the direction. */
  rotationSpeed?: number
}

export function useObjectRotation(
  ref: RefObject<Group | null>,
  { spin = true, rotationAxis = 'y', rotationSpeed = 0.3 }: ObjectRotationOptions = {},
) {
  const active = spin && Number.isFinite(rotationSpeed) && rotationSpeed !== 0
  const previouslyActive = useRef(active)
  const resumeFrame = useRef(false)

  useLayoutEffect(() => {
    if (active && !previouslyActive.current) resumeFrame.current = true
    previouslyActive.current = active
  }, [active])

  useFrame((_state, delta) => {
    if (!active || !ref.current || !Number.isFinite(delta) || delta < 0) return
    // Demand rendering can deliver the whole idle interval on resume. Discard
    // just that first frame; subsequent irregular deltas are never clamped.
    if (resumeFrame.current) {
      resumeFrame.current = false
      return
    }
    ref.current.rotation[rotationAxis] += rotationSpeed * delta
  })
}
