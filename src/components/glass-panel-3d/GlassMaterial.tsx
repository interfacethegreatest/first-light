// Pale cool glass picks up the environment without an opaque charcoal tint.
// Transmission refracts Three.js content; CSS handles blur over native HTML.
export default function GlassMaterial() {
  return (
    <meshPhysicalMaterial
      color="#cdd2d9"
      transmission={0.95}
      roughness={0.2}
      thickness={0.4}
      ior={1.45}
      envMapIntensity={0.4}
      metalness={0}
      clearcoat={0.75}
      clearcoatRoughness={0.18}
    />
  )
}
