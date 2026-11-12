import { apiHandler, sendJson } from '../../src/server/http/response.js'
import { readSessionConfig, type SessionConfig } from '../../src/server/lib/session-config.js'
import { validateSession } from '../../src/server/auth/sessions.js'
import { clearSessionCookie, readSessionCookie } from '../../src/server/auth/session-http.js'

function sessionHandler(resolveConfig: () => SessionConfig) {
  return apiHandler('GET', async (request, response) => {
    const config = resolveConfig()
    const cookie = readSessionCookie(request, config)
    try {
      const session = await validateSession(cookie.token)
      if (!session) {
        if (cookie.present) clearSessionCookie(response, config)
        sendJson(request, response, 200, { authenticated: false, user: null })
        return
      }
      sendJson(request, response, 200, {
        authenticated: true,
        user: session.user,
        expiresAt: session.expiresAt.toISOString(),
      })
    } catch {
      // A temporary database outage does not invalidate the browser's cookie.
      sendJson(request, response, 503, { error: 'Session service unavailable.' })
    }
  }, { varyCookie: true })
}

export function createSessionHandler(config: SessionConfig = readSessionConfig()) {
  return sessionHandler(() => config)
}

// Read environment settings inside the request boundary, not at module import.
export default sessionHandler(readSessionConfig)
