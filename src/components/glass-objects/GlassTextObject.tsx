import { useCallback, useLayoutEffect, useRef } from 'react'
import { Center, Text3D } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DEFAULT_GLASS_SETTINGS, TransmissionSurface } from '../transmission/GlassPrimitives'
import type { ObjectProps } from './glassObjectTypes'
import { useObjectRotation } from './useObjectRotation'

export const GLASS_TEXT_FONT_URL = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`

// The 0.1664-unit I stem keeps a 0.1064-unit cap after the inset. The shoulder
// offset is +0.03; extra spacing leaves room between the rounded outlines.
const TEXT_PROFILE = {
  size: 0.8,
  height: 0.2,
  curveSegments: 18,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.06,
  bevelOffset: -0.03,
  bevelSegments: 10,
  letterSpacing: 0.06,
}

export interface GlassTextBounds {
  width: number
  height: number
  depth: number
}

export interface GlassTextObjectProps extends ObjectProps {
  text?: string
  onBounds?: (bounds: GlassTextBounds) => void
}

/** One centered text mesh with the same glass material as the existing objects. */
export function GlassTextObject({
  text = 'LIGHT',
  settings = DEFAULT_GLASS_SETTINGS,
  spin,
  rotationAxis,
  rotationSpeed,
  onRendered,
  onBounds,
  ...groupProps
}: GlassTextObjectProps) {
  const rotation = useRef<Group>(null)
  const textMesh = useRef<Mesh>(null)
  useObjectRotation(rotation, { spin, rotationAxis, rotationSpeed })

  useLayoutEffect(() => {
    const mesh = textMesh.current
    if (!mesh) return
    const source = mesh.geometry
    const weldSource = source.clone()
    // The shared glass material has no UV maps. Removing UV/normal seams lets
    // adjacent bevel faces share genuinely smooth normals, like the torus.
    weldSource.deleteAttribute('normal')
    weldSource.deleteAttribute('uv')
    const rounded = mergeVertices(weldSource, 0.001)
    weldSource.dispose()
    rounded.computeVertexNormals()
    mesh.geometry = rounded
    return () => {
      if (mesh.geometry === rounded) mesh.geometry = source
      rounded.dispose()
    }
  }, [text])

  const reportBounds = useCallback(({ width, height, depth }: GlassTextBounds) => {
    onBounds?.({ width, height, depth })
  }, [onBounds])

  return (
    <group {...groupProps}>
      <group ref={rotation}>
        <Center cacheKey={text} onCentered={reportBounds}>
          <Text3D
            ref={textMesh}
            font={GLASS_TEXT_FONT_URL}
            {...TEXT_PROFILE}
            onAfterRender={onRendered}
          >
            {text}
            <TransmissionSurface settings={settings} animate={false} />
          </Text3D>
        </Center>
      </group>
    </group>
  )
}

export default GlassTextObject
