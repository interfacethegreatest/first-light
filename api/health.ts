import { apiHandler, sendJson } from '../src/server/http/response.js'

// This entry has no database import: liveness must not depend on MongoDB.
export default apiHandler('GET', (request, response) => {
  sendJson(request, response, 200, { status: 'ok' })
})
