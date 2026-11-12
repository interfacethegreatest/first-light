import { apiHandler, sendJson } from '../src/server/http/response.js'
import { readSampleUsers } from '../src/server/lib/sample-users.js'

const SAFE_ERROR_TYPES = new Set([
  'Error', 'TypeError', 'MongoServerError', 'MongoNetworkError', 'MongoNetworkTimeoutError',
  'MongoServerSelectionError', 'MongooseServerSelectionError', 'MongoParseError',
  'MongoAPIError', 'MongoInvalidArgumentError', 'MongoNotConnectedError',
])
const SAFE_NODE_CODES = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET',
  'EHOSTUNREACH', 'ENETUNREACH', 'ERR_INVALID_URL', 'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
])

/** Bounded, allowlisted metadata only; no raw errors or arbitrary string fields. */
function errorCategories(error: unknown): Array<{ type: string; code?: number | string }> {
  const categories: Array<{ type: string; code?: number | string }> = []
  for (let current = error, depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const value = current as { name?: unknown; code?: unknown; cause?: unknown }
    const type = typeof value.name === 'string' && SAFE_ERROR_TYPES.has(value.name) ? value.name : 'UnknownError'
    const code = typeof value.code === 'number' && Number.isSafeInteger(value.code)
      || typeof value.code === 'string' && SAFE_NODE_CODES.has(value.code) ? value.code : undefined
    categories.push(code === undefined ? { type } : { type, code })
    current = value.cause
  }
  return categories
}

/** Fixed codes only: driver messages/connection strings never reach logs or clients. */
function failureCode(error: unknown): string {
  let unreachable = false
  for (let current = error, depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const value = current as { code?: unknown; name?: unknown; message?: unknown; cause?: unknown }
    if (value.code === 13) return 'SAMPLE_DATABASE_ACCESS_DENIED'
    if (value.code === 18) return 'DATABASE_AUTHENTICATION_FAILED'
    if (value.code === 8000 && typeof value.message === 'string'
      && /bad auth|authentication failed/i.test(value.message)) return 'DATABASE_AUTHENTICATION_FAILED'
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
      if (code === 'SAMPLE_DATA_UNAVAILABLE') console.error('MongoDB sample-user failure categories:', errorCategories(error))
      sendJson(request, response, 503, {
        error: 'Could not read sample users. Check MongoDB connectivity and read access to sample_mflix.users.', code,
      })
    }
  })
}

export default createDemoHandler()
