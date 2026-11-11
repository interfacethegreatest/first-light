// CPU-only settings: native controls must not eagerly import the GPU renderer.
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
