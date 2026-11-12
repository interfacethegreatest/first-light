import { apiHandler, sendEmpty, sendJson } from '../../src/server/http/response.js'
import { readSessionConfig, type SessionConfig } from '../../src/server/lib/session-config.js'
import { revokeAllUserSessions } from '../../src/server/auth/sessions.js'
import { clearSessionCookie, requireSameOrigin, requireSession } from '../../src/server/auth/session-http.js'

function logoutAllHandler(resolveConfig: () => SessionConfig) {
  return apiHandler('POST', async (request, response) => {
    const config = resolveConfig()
    await requireSameOrigin(requireSession(async (request, response, session) => {
      try { await revokeAllUserSessions(session.userId) }
      catch {
        sendJson(request, response, 503, { error: 'Session service unavailable.' })
        return
      }
      clearSessionCookie(response, config)
      sendEmpty(response, 204)
    }, config), config)(request, response)
  }, { varyCookie: true })
}

export function createLogoutAllHandler(config: SessionConfig = readSessionConfig()) {
  return logoutAllHandler(() => config)
}

export default logoutAllHandler(readSessionConfig)
