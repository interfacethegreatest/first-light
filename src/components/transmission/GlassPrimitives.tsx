import { MeshTransmissionMaterial } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

export interface GlassSettings {
  transmission: number
  thickness: number
  roughness: number
  ior: number
  chromaticAberration: number
  anisotropicBlur: number
  distortion: number
  distortionScale: number
  temporalDistortion: number
  backside: boolean
  backsideThickness: number
  samples: number
  resolution: number
  color: string
}

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  transmission: 1,
  thickness: 0.85,
  roughness: 0.08,
  ior: 1.4,
  chromaticAberration: 0.04,
  anisotropicBlur: 0.2,
  distortion: 0.2,
  distortionScale: 0.3,
  temporalDistortion: 0.1,
  backside: true,
  backsideThickness: 0.3,
  samples: 6,
  resolution: 512,
  color: '#e8f4ff',
}

export function TransmissionSurface({
  settings,
  animate = false,
}: {
  settings: GlassSettings
  animate?: boolean
}) {
  const materialProps = {
    // Use automatic scene capture, without an external buffer or shared sampler.
    transmissionSampler: false,
    // Full optical transmission is independent of CSS opacity.
    transmission: settings.transmission,
    // Estimate optical travel distance; actual geometry thickness is separate.
    thickness: settings.thickness,
    // Mild scattering softens otherwise perfectly sharp refraction.
    roughness: settings.roughness,
    // Moderate refraction bends the scene without an extreme lens effect.
    ior: settings.ior,
    // Subtle RGB separation adds a refractive edge.
    chromaticAberration: settings.chromaticAberration,
    // Directional scattering gives the glass a less polished appearance.
    anisotropicBlur: settings.anisotropicBlur,
    // Spatial distortion supplies the liquid-glass character.
    distortion: settings.distortion,
    // Broad distortion patterns avoid finely rippled noise.
    distortionScale: settings.distortionScale,
    // Static mode removes temporal distortion; the parent owns frame scheduling.
    temporalDistortion: animate ? settings.temporalDistortion : 0,
    // Capture the reverse surface to strengthen the sense of volume.
    backside: settings.backside,
    // Estimate optical thickness separately for that reverse-surface pass.
    backsideThickness: settings.backsideThickness,
    // Explicitly select the user's sample count instead of Drei's default ten.
    samples: settings.samples,
    // Drei embeds this count in GLSL; keep quality changes out of Three's old program cache.
    customProgramCacheKey: () => `first-light-transmission-v1:${settings.samples}`,
    // Bound capture size; backside resolution follows this value by default.
    resolution: settings.resolution,
    // Pale cool glass retains light rather than creating an opaque dark fill.
    color: settings.color,
    // Glass is a dielectric, not a metallic surface.
    metalness: 0,
    // Keep environment reflections visible without overpowering transmission.
    envMapIntensity: 0.8,
    // A restrained clear layer defines the surface highlights.
    clearcoat: 0.75,
    // Soften those clearcoat highlights instead of using a hard mirror finish.
    clearcoatRoughness: 0.18,
    // Keep the material opaque for compositing; transmission carries the light.
    opacity: 1,
  }

  return <MeshTransmissionMaterial {...materialProps} />
}

export type GlassPrimitiveProps = Omit<
  ThreeElements['mesh'],
  'args' | 'children' | 'geometry' | 'material'
> & {
  settings: GlassSettings
  animate?: boolean
}

const SPHERE_ARGS: [radius: number, widthSegments: number, heightSegments: number] = [1, 128, 96]
const TORUS_ARGS: [radius: number, tube: number, radialSegments: number, tubularSegments: number] = [1, 0.34, 48, 192]

// One host and one material avoid automatic capture mutating a material array.
// Native mesh props, including refs, pass through without geometry overrides.
export function GlassSphere({ settings, animate = false, ...meshProps }: GlassPrimitiveProps) {
  return (
    <mesh {...meshProps}>
      <sphereGeometry args={SPHERE_ARGS} />
      <TransmissionSurface settings={settings} animate={animate} />
    </mesh>
  )
}

export function GlassTorus({ settings, animate = false, ...meshProps }: GlassPrimitiveProps) {
  return (
    <mesh {...meshProps}>
      <torusGeometry args={TORUS_ARGS} />
      <TransmissionSurface settings={settings} animate={animate} />
    </mesh>
  )
}
