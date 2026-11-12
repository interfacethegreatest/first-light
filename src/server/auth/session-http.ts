import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Types } from 'mongoose'
import { readSessionConfig, type SessionConfig } from '../lib/session-config.js'
import { apiHandler, appendSetCookie, noStore, sendJson, type ApiHandler } from '../http/response.js'
import {
  createSession, revokeSession, validateSession,
  type AuthenticatedSession,
} from './sessions.js'

export interface SessionCookie {
  present: boolean
  token: string | null
}

/** Read only our host cookie. Ambiguous or malformed credentials fail closed. */
export function readSessionCookie(request: IncomingMessage, config: SessionConfig = readSessionConfig()): SessionCookie {
  const header = request.headers.cookie
  if (!header) return { present: false, token: null }
  if (header.length > 8192) return { present: true, token: null }

  const values: string[] = []
  for (const part of header.split(';')) {
    const equals = part.indexOf('=')
    const name = (equals < 0 ? part : part.slice(0, equals)).trim()
    if (name === config.cookieName) values.push(equals < 0 ? '' : part.slice(equals + 1).trim())
  }
  if (values.length === 0) return { present: false, token: null }
  if (values.length !== 1) return { present: true, token: null }

  let token: string
  try { token = decodeURIComponent(values[0]!) }
  catch { return { present: true, token: null } }
  return { present: true, token: /^[a-f0-9]{64}$/.test(token) ? token : null }
}

export function readSessionToken(request: IncomingMessage, config: SessionConfig = readSessionConfig()): string | null {
  return readSessionCookie(request, config).token
}

function cookieFlags(config: SessionConfig): string {
  return '; Path=/; HttpOnly; SameSite=Lax' + (config.secure ? '; Secure' : '')
}

export function clearSessionCookie(response: ServerResponse, config: SessionConfig = readSessionConfig()): void {
  appendSetCookie(response, `${config.cookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieFlags(config)}`)
}

/** Unsafe browser requests must originate at the configured site, never a supplied Host. */
export function requireSameOrigin(
  handler: ApiHandler,
  config: SessionConfig = readSessionConfig(),
): ApiHandler {
  return async (request, response) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? '') && request.headers.origin !== config.appOrigin) {
      sendJson(request, response, 403, { error: 'Request origin is not allowed.' })
      return
    }
    await handler(request, response)
  }
}

export type AuthenticatedHandler = (
  request: IncomingMessage,
  response: ServerResponse,
  session: AuthenticatedSession,
) => void | Promise<void>

/** Future research handlers receive the authoritative user ID as the third argument. */
export function requireSession(
  handler: AuthenticatedHandler,
  config: SessionConfig = readSessionConfig(),
): ApiHandler {
  return apiHandler(null, async (request, response) => {
    const cookie = readSessionCookie(request, config)
    let session: AuthenticatedSession | null
    try { session = await validateSession(cookie.token) }
    catch {
      sendJson(request, response, 503, { error: 'Session service unavailable.' })
      return
    }
    if (!session) {
      if (cookie.present) clearSessionCookie(response, config)
      sendJson(request, response, 401, { error: 'Sign-in required.' })
      return
    }
    await handler(request, response, session)
  }, { varyCookie: true })
}

/**
 * Server-only login completion AFTER a provider has verified identity. Never expose a
 * route that calls this with a browser-supplied user ID. Fresh issuance prevents fixation.
 */
export async function establishVerifiedSession(
  request: IncomingMessage,
  response: ServerResponse,
  userId: string | Types.ObjectId,
  config: SessionConfig = readSessionConfig(),
): Promise<{ sessionId: string; userId: string; expiresAt: Date }> {
  if (response.headersSent) throw new Error('A session must be established before sending a response.')
  noStore(response, true)

  const previous = readSessionToken(request, config)
  const issued = await createSession(userId, { ttlMs: config.ttlMs })
  try {
    await revokeSession(previous)
    const maxAge = Math.max(0, Math.floor((issued.expiresAt.getTime() - Date.now()) / 1000))
    appendSetCookie(response,
      `${config.cookieName}=${encodeURIComponent(issued.token)}; Max-Age=${maxAge}; Expires=${issued.expiresAt.toUTCString()}${cookieFlags(config)}`,
    )
  } catch (error) {
    // Do not leave an unissued token active when rotation or writing the cookie failed.
    // If the database is unavailable, its finite expiry still bounds the unused record.
    try { await revokeSession(issued.token) } catch { /* Preserve the original failure. */ }
    throw error
  }
  return { sessionId: issued.sessionId, userId: issued.userId, expiresAt: issued.expiresAt }
}
