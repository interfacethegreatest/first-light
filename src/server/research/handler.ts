import { requireSameOrigin, requireSession } from '../auth/session-http.js'
import { readJson, RequestError } from '../http/json.js'
import { apiHandler, sendJson, type ApiHandler } from '../http/response.js'
import type { SessionConfig } from '../lib/session-config.js'
import { validateResearchWrite } from './validation.js'
import { importResearch, readResearch, replaceResearch } from './workspaces.js'

/** Both default function exports and the local router execute these same boundaries. */
export function researchHandler(resolveConfig: () => SessionConfig, importing = false): ApiHandler {
  return apiHandler(null, async (request, response) => {
    const methods = importing ? ['POST'] : ['GET', 'HEAD', 'PUT']
    if (request.method === 'OPTIONS') {
      response.setHeader('Allow', methods.join(', '))
      sendJson(request, response, 200, { methods })
      return
    }
    if (!methods.includes(request.method ?? '')) {
      response.setHeader('Allow', methods.join(', '))
      sendJson(request, response, 405, { error: 'Method not allowed.' })
      return
    }
    const config = resolveConfig()
    await requireSameOrigin(requireSession(async (request, response, session) => {
      try {
        // A shared browser cookie can switch accounts in another tab. This is a
        // precondition, never the ownership source: queries still use session.userId.
        const account = request.headers['x-first-light-account']
        const reading = request.method === 'GET' || request.method === 'HEAD'
        if ((!reading || account !== undefined) && account !== session.userId) {
          throw new RequestError(409, 'Account changed. Refresh session.')
        }
        if (request.method === 'GET' || request.method === 'HEAD') {
          sendJson(request, response, 200, await readResearch(session.userId))
          return
        }
        const { workspace, expectedRevision } = validateResearchWrite(await readJson(request))
        const result = importing
          ? await importResearch(session.userId, workspace, expectedRevision)
          : await replaceResearch(session.userId, workspace, expectedRevision)
        sendJson(request, response, 200, result)
      } catch (error) {
        if (error instanceof RequestError) sendJson(request, response, error.status, { error: error.message })
        else sendJson(request, response, 503, { error: 'Research service unavailable.' })
      }
    }, config), config)(request, response)
  }, { varyCookie: true })
}
