import { useFont } from '@react-three/drei'

export const TRANSMISSION_ENVIRONMENT_URL = `${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`
export const TRANSMISSION_FONT_URL = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`

/** An explicit asset-error retry evicts only this scene's font loader key.
 * Its procedural studio does not consume the HDR shared by other panels.
 * Clearing this entry does not dispose resources retained by other scenes.
 * Context-only retries keep the successful cache entries.
 */
export function clearTransmissionAssetCache() {
  useFont.clear(TRANSMISSION_FONT_URL)
}
