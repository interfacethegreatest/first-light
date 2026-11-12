import { researchHandler } from '../../src/server/research/handler.js'
import { readSessionConfig, type SessionConfig } from '../../src/server/lib/session-config.js'

export function createImportResearchHandler(config: SessionConfig = readSessionConfig()) {
  return researchHandler(() => config, true)
}
export default researchHandler(readSessionConfig, true)
