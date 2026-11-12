import { apiHandler, sendEmpty, sendJson } from '../../src/server/http/response.js'
import { readSessionConfig, type SessionConfig } from '../../src/server/lib/session-config.js'
import { revokeSession } from '../../src/server/auth/sessions.js'
import { clearSessionCookie, readSessionCookie, requireSameOrigin } from '../../src/server/auth/session-http.js'

function logoutHandler(resolveConfig: () => SessionConfig) {
  return apiHandler('POST', async (request, response) => {
    const config = resolveConfig()
    await requireSameOrigin(async (request, response) => {
      const cookie = readSessionCookie(request, config)
      try { await revokeSession(cookie.token) }
      catch {
        sendJson(request, response, 503, { error: 'Session service unavailable.' })
        return
      }
      clearSessionCookie(response, config)
      sendEmpty(response, 204)
    }, config)(request, response)
  }, { varyCookie: true })
}

export function createLogoutHandler(config: SessionConfig = readSessionConfig()) {
  return logoutHandler(() => config)
}

export default logoutHandler(readSessionConfig)
