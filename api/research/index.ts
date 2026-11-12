import { researchHandler } from '../../src/server/research/handler.js'
import { readSessionConfig, type SessionConfig } from '../../src/server/lib/session-config.js'

export function createResearchHandler(config: SessionConfig = readSessionConfig()) {
  return researchHandler(() => config)
}
export default researchHandler(readSessionConfig)
