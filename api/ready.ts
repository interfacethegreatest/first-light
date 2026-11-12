import { apiHandler, sendJson } from '../src/server/http/response.js'
import { pingDatabase } from '../src/server/lib/db.js'

export function createReadyHandler(checkDatabase: () => Promise<void> = pingDatabase) {
  return apiHandler('GET', async (request, response) => {
    try {
      await checkDatabase()
      sendJson(request, response, 200, { status: 'ready' })
    } catch {
      sendJson(request, response, 503, { status: 'unavailable' })
    }
  })
}

// Factory creation is harmless; only a request performs the read-only ping.
export default createReadyHandler()
