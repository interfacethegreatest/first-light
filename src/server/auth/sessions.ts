import { createHash, randomBytes } from 'node:crypto'
import { Types } from 'mongoose'
import { connectDatabase } from '../lib/db.js'
import { MAX_SESSION_LIFETIME_MS, readSessionLifetimeMs } from '../lib/session-config.js'
import { getSessionModel, getReadySessionModel } from '../models/Session.js'
import { getUserModel } from '../models/User.js'

export interface SessionOptions {
  ttlMs?: number
}

/** Server-only issuance result. Send token through the HttpOnly cookie, never JSON or logs. */
export interface IssuedSession {
  token: string
  sessionId: string
  userId: string
  expiresAt: Date
}

export interface AuthenticatedSession {
  sessionId: string
  userId: string
  expiresAt: Date
  user: {
    id: string
    email?: string
    name?: string
    image?: string
  }
}

function parseUserId(userId: string | Types.ObjectId): Types.ObjectId {
  const value = typeof userId === 'string' ? userId
    : userId instanceof Types.ObjectId ? userId.toHexString() : ''
  if (!/^[a-fA-F0-9]{24}$/.test(value)) throw new TypeError('A valid user ID is required.')
  return new Types.ObjectId(value)
}

function hashToken(token: unknown): string | null {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null
  return createHash('sha256').update(token).digest('hex')
}

/** Call only after server-side login verification has resolved an existing User. */
export async function createSession(userId: string | Types.ObjectId, options: SessionOptions = {}): Promise<IssuedSession> {
  const id = parseUserId(userId)
  const ttlMs = options.ttlMs ?? readSessionLifetimeMs()
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0 || ttlMs > MAX_SESSION_LIFETIME_MS) {
    throw new TypeError('Session lifetime must be positive and at most 365 days.')
  }

  const connection = await connectDatabase()
  if (!await getUserModel(connection).exists({ _id: id }).exec()) {
    throw new Error('Cannot create a session for an unknown user.')
  }
  const Session = await getReadySessionModel()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlMs)
  const session = await Session.create({
    userId: id,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt,
    revokedAt: null,
  })
  return { token, sessionId: session._id.toHexString(), userId: id.toHexString(), expiresAt }
}

/**
 * Read-only validation on every request. TTL deletion is asynchronous, so expiry and
 * revocation are enforced here immediately, including after a server restart.
 */
export async function validateSession(token: unknown): Promise<AuthenticatedSession | null> {
  const tokenHash = hashToken(token)
  if (!tokenHash) return null

  const connection = await connectDatabase()
  const session = await getSessionModel(connection).findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  }).select('userId expiresAt').lean().exec()
  if (!session) return null

  const user = await getUserModel(connection).findById(session.userId)
    .select('email name image').lean().exec()
  if (!user) return null

  return {
    sessionId: session._id.toHexString(),
    userId: user._id.toHexString(),
    expiresAt: session.expiresAt,
    user: { id: user._id.toHexString(), email: user.email, name: user.name, image: user.image },
  }
}

/** Revokes only this token. Repeating the operation is safe. */
export async function revokeSession(token: unknown): Promise<boolean> {
  const tokenHash = hashToken(token)
  if (!tokenHash) return false
  const Session = await getReadySessionModel()
  const result = await Session.updateOne({ tokenHash, revokedAt: null }, {
    $set: { revokedAt: new Date() },
  }).exec()
  return result.modifiedCount > 0
}

/** Use a server-authenticated user ID or an administrator's explicit ID, never request.body. */
export async function revokeAllUserSessions(userId: string | Types.ObjectId): Promise<number> {
  const id = parseUserId(userId)
  const Session = await getReadySessionModel()
  const result = await Session.updateMany({ userId: id, revokedAt: null }, {
    $set: { revokedAt: new Date() },
  }).exec()
  return result.modifiedCount
}
