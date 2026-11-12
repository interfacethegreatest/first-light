import { apiHandler, sendJson } from '../src/server/http/response.js'
import { readSampleUsers } from '../src/server/lib/sample-users.js'

/** Fixed codes only: driver messages/connection strings never reach logs or clients. */
function failureCode(error: unknown): string {
  let unreachable = false
  for (let current = error, depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const value = current as { code?: unknown; name?: unknown; message?: unknown; cause?: unknown }
    if (value.code === 13) return 'SAMPLE_DATABASE_ACCESS_DENIED'
    if (value.code === 18) return 'DATABASE_AUTHENTICATION_FAILED'
    if (value.message === 'Set MONGODB_URI to a MongoDB connection string.') return 'DATABASE_CONFIGURATION_INVALID'
    if (value.name === 'MongoParseError' || value.code === 'ERR_INVALID_URL') return 'DATABASE_URI_INVALID'
    if (value.name === 'MongoServerSelectionError' || value.name === 'MongooseServerSelectionError') unreachable = true
    current = value.cause
  }
  return unreachable ? 'DATABASE_UNREACHABLE' : 'SAMPLE_DATA_UNAVAILABLE'
}

export function createDemoHandler(readUsers = readSampleUsers) {
  return apiHandler('GET', async (request, response) => {
    try {
      const data = await readUsers()
      sendJson(request, response, 200, {
        message: 'Sample users read from MongoDB.',
        database: 'sample_mflix', collection: 'users', data,
      })
    } catch (error) {
      const code = failureCode(error)
      console.error('MongoDB sample-user lookup failed:', code)
      sendJson(request, response, 503, {
        error: 'Could not read sample users. Check MongoDB connectivity and read access to sample_mflix.users.', code,
      })
    }
  })
}

export default createDemoHandler()
