import { Environment, Lightformer } from '@react-three/drei'

/** Reflection lighting without a room/city photograph imprinted on the glass. */
export function GlassStudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  return (
    <Environment frames={1} resolution={128} background={false}>
      {/* These softboxes exist only in Environment's separate capture scene.
          They never add shapes to the visible object scene or its backdrop. */}
      <color attach="background" args={['#151820']} />
      <Lightformer form="circle" intensity={4.5 * intensity} color="#f0f5ff"
        scale={[7, 8, 1]} position={[4, 4, 5]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={2.25 * intensity} color="#b8ddff"
        scale={8} position={[-4, 1, 3]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={3 * intensity} color="#fff4e8"
        scale={[3, 12, 1]} position={[0, 5, -2]} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={1.25 * intensity} color="#f0f5ff"
        scale={8} position={[0, 0, 5]} target={[0, 0, 0]} />
    </Environment>
  )
}
