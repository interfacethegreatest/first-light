import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import mongoose, { Types, type Connection, type Model } from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectDatabase, closeDatabase } from '../../src/server/lib/db.js'
import { getReadyUserModel, type UserRecord } from '../../src/server/models/User.js'
import { getReadySessionModel, getSessionModel, type SessionRecord } from '../../src/server/models/Session.js'
import { createSession, validateSession, revokeSession, revokeAllUserSessions } from '../../src/server/auth/sessions.js'
import { createApp } from '../../src/server/app.js'
import { apiHandler, sendJson } from '../../src/server/http/response.js'
import { establishVerifiedSession, requireSession } from '../../src/server/auth/session-http.js'
import { onVerifiedOAuthSessionCallback } from '../../src/server/examples/oauth-callback.js'
import type { SessionConfig } from '../../src/server/lib/session-config.js'

const execute = promisify(execFile)
const testUri = process.env.TEST_MONGODB_URI
if (testUri) {
  const uri = new URL(testUri)
  if (uri.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(uri.hostname)
    || uri.pathname !== '/first_light_backend_test' || uri.username || uri.password) {
    throw new Error('Session integration tests require a disposable loopback first_light_backend_test database without credentials.')
  }
}

describe.skipIf(!testUri)('real MongoDB persistent sessions', () => {
  let connection: Connection
  let User: Model<UserRecord>
  let Session: Model<SessionRecord>
  let userId: Types.ObjectId
  let otherId: Types.ObjectId
  const servers: Server[] = []
  const config: SessionConfig = { appOrigin: 'http://127.0.0.1:3001', cookieName: 'first-light-session', secure: false, ttlMs: 86400000 }
  const cookie = (token: string) => config.cookieName + '=' + token

  async function serve() {
    // Fixed server-created identity fixtures stand in for an already verified callback.
    // These routes exist only in this loopback test harness, never in production app.ts.
    const fallback = createApp(async () => {}, config)
    const owner = requireSession((request, response, session) => { sendJson(request, response, 200, { ownerId: session.userId }) }, config)
    const wrapper = apiHandler(null, async (request, response) => {
      const path = new URL(request.url ?? '/', 'http://local.invalid').pathname
      if (path === '/fixture/verified-login') {
        await establishVerifiedSession(request, response, userId, config)
        sendJson(request, response, 200, { signedIn: true })
      } else if (path === '/fixture/verified-callback') {
        const user = await onVerifiedOAuthSessionCallback(request, response, 'google', { sub: 'fixture-subject', name: 'Fixture callback' })
        sendJson(request, response, 200, { userId: user.id })
      } else {
        await (path === '/fixture/research-owner' ? owner : fallback)(request, response)
      }
    })
    const server = createServer(wrapper)
    servers.push(server)
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    return 'http://127.0.0.1:' + (server.address() as AddressInfo).port
  }

  beforeAll(async () => {
    vi.stubEnv('MONGODB_URI', testUri!)
    vi.stubEnv('SESSION_TTL_DAYS', '30')
    vi.stubEnv('APP_ORIGIN', config.appOrigin)
    connection = await connectDatabase()
    expect(connection.name).toBe('first_light_backend_test')
    await connection.dropDatabase()
  }, 15000)
  beforeEach(async () => {
    connection = await connectDatabase()
    User = await getReadyUserModel()
    Session = await getReadySessionModel()
    await Session.deleteMany({})
    await User.deleteMany({})
    userId = (await User.create({ name: 'Researcher A', email: 'a@example.org', identities: [{ provider: 'google', providerAccountId: 'a' }] }))._id
    otherId = (await User.create({ name: 'Researcher B', identities: [{ provider: 'github', providerAccountId: 'b' }] }))._id
  })
  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
      server.closeIdleConnections()
    })))
  })
  afterAll(async () => {
    try { await (await connectDatabase()).dropDatabase() }
    finally { await closeDatabase(); vi.unstubAllEnvs() }
  }, 15000)

  it('issues independent 256-bit credentials and stores only indexed hashes', async () => {
    const issued = await Promise.all(Array.from({ length: 20 }, () => createSession(userId)))
    expect(new Set(issued.map(value => value.token)).size).toBe(20)
    expect(issued.every(value => /^[a-f0-9]{64}$/.test(value.token))).toBe(true)
    expect(await Session.countDocuments()).toBe(20)
    const record = await Session.findById(issued[0]!.sessionId).select('+tokenHash').lean()
    expect(record!.tokenHash === createHash('sha256').update(issued[0]!.token).digest('hex')).toBe(true)
    expect(issued.every(value => !JSON.stringify(record).includes(value.token))).toBe(true)
    expect(await Session.findById(issued[0]!.sessionId).lean()).not.toHaveProperty('tokenHash')
    const indexes = await Session.collection.indexes()
    expect(indexes.find(value => value.name === 'unique_session_token_hash')?.unique).toBe(true)
    expect(indexes.find(value => value.name === 'expired_session_cleanup')?.expireAfterSeconds).toBe(0)
    expect(indexes.find(value => value.name === 'sessions_by_user')?.key).toEqual({ userId: 1 })
    expect(getSessionModel(connection)).toBe(Session)
  })

  it('rejects absent users, malformed IDs/lifetimes and malformed tokens before a connection is attempted', async () => {
    await expect(createSession(new Types.ObjectId())).rejects.toThrow('unknown user')
    for (const invalid of ['', 'forged', { $ne: null }]) {
      await expect(createSession(invalid as string)).rejects.toThrow('valid user ID')
    }
    for (const ttlMs of [0, -1, 1.5, Infinity, 366 * 86400000]) {
      await expect(createSession(userId, { ttlMs })).rejects.toThrow('Session lifetime')
    }
    await closeDatabase()
    vi.stubEnv('MONGODB_URI', 'invalid-not-a-uri')
    try {
      for (const value of [undefined, null, '', 'bad', 'A'.repeat(64), { $ne: null }]) {
        expect(await validateSession(value)).toBeNull()
        expect(await revokeSession(value)).toBe(false)
      }
    } finally { vi.stubEnv('MONGODB_URI', testUri!) }
  })

  it('recognizes repeat visits across a new pool without sliding the absolute expiry or writing on validation', async () => {
    const issued = await createSession(userId)
    const original = await Session.findById(issued.sessionId).lean()
    const first = await validateSession(issued.token)
    expect(first?.userId).toBe(userId.toHexString())
    expect(first?.user).toEqual({ id: userId.toHexString(), name: 'Researcher A', email: 'a@example.org', image: undefined })
    expect(JSON.stringify(first).includes(issued.token)).toBe(false)
    expect(first).not.toHaveProperty('tokenHash')
    const old = connection
    await closeDatabase()
    expect(mongoose.connections).not.toContain(old)
    const second = await validateSession(issued.token)
    expect(second?.sessionId).toBe(first?.sessionId)
    expect(second?.expiresAt.getTime()).toBe(issued.expiresAt.getTime())
    connection = await connectDatabase()
    Session = await getReadySessionModel()
    expect(await Session.findById(issued.sessionId).lean()).toEqual(original)
    expect(mongoose.connections.filter(value => value.readyState === 1)).toHaveLength(1)
  })

  it('enforces expiry while an expired record still exists, without depending on the TTL monitor', async () => {
    const issued = await createSession(userId)
    // Simulate delayed TTL cleanup in the disposable DB; production code is unchanged.
    await Session.collection.dropIndex('expired_session_cleanup')
    try {
      await Session.updateOne({ _id: issued.sessionId }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
      expect(await Session.exists({ _id: issued.sessionId })).not.toBeNull()
      expect(await validateSession(issued.token)).toBeNull()
      expect(await Session.exists({ _id: issued.sessionId })).not.toBeNull()
    } finally { await Session.createIndexes() }
  })

  it('revokes one or every owned session idempotently without affecting other users', async () => {
    const first = await createSession(userId)
    const second = await createSession(userId)
    const other = await createSession(otherId)
    expect(await revokeSession(first.token)).toBe(true)
    expect(await revokeSession(first.token)).toBe(false)
    expect(await validateSession(first.token)).toBeNull()
    expect(await validateSession(second.token)).not.toBeNull()
    expect(await revokeAllUserSessions(userId)).toBe(1)
    expect(await revokeAllUserSessions(userId)).toBe(0)
    expect(await validateSession(second.token)).toBeNull()
    expect((await validateSession(other.token))?.userId).toBe(otherId.toHexString())
    const orphan = await createSession(otherId)
    await User.deleteOne({ _id: otherId })
    expect(await validateSession(orphan.token)).toBeNull()
  })

  it('sets persistent HttpOnly cookies after verified login and exposes only safe user data', async () => {
    const base = await serve()
    expect(await (await fetch(base + '/api/auth/session')).json()).toEqual({ authenticated: false, user: null })
    const signedIn = await fetch(base + '/fixture/verified-login')
    const header = signedIn.headers.get('set-cookie') ?? ''
    expect(['HttpOnly', 'SameSite=Lax', 'Path=/', 'Expires=', 'Max-Age='].every(flag => header.includes(flag))).toBe(true)
    expect(header.includes('Domain=')).toBe(false)
    const credential = header.split(';')[0]!
    const raw = credential.slice(credential.indexOf('=') + 1)
    expect(/^[a-f0-9]{64}$/.test(raw)).toBe(true)
    const loginBody = await signedIn.json()
    expect(loginBody).toEqual({ signedIn: true })
    expect(JSON.stringify(loginBody).includes(raw)).toBe(false)
    const response = await fetch(base + '/api/auth/session', { headers: { cookie: credential } })
    const body = await response.json()
    expect(body.authenticated).toBe(true)
    expect(body.user).toEqual({ id: userId.toHexString(), name: 'Researcher A', email: 'a@example.org' })
    expect(typeof body.expiresAt).toBe('string')
    expect(JSON.stringify(body).includes(raw)).toBe(false)
    expect(body).not.toHaveProperty('sessionId')
    const owner = await fetch(base + '/fixture/research-owner?userId=' + otherId, { headers: { cookie: credential } })
    expect(await owner.json()).toEqual({ ownerId: userId.toHexString() })
    for (const path of ['/api/auth/login', '/users', '/auth/callback']) {
      expect((await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId, provider: 'google', sub: 'forged' }) })).status).toBe(404)
    }
  })

  it('rotates the previous browser credential through the private callback while leaving other-device sessions valid', async () => {
    const base = await serve()
    const previous = await createSession(userId)
    const anotherDevice = await createSession(userId)
    const response = await fetch(base + '/fixture/verified-callback', { headers: { cookie: cookie(previous.token) } })
    expect(response.status).toBe(200)
    const body = await response.json()
    const credential = (response.headers.get('set-cookie') ?? '').split(';')[0]!
    const fresh = credential.slice(credential.indexOf('=') + 1)
    expect(fresh !== previous.token).toBe(true)
    expect(await validateSession(previous.token)).toBeNull()
    expect((await validateSession(fresh))?.userId).toBe(body.userId)
    expect(await validateSession(anotherDevice.token)).not.toBeNull()
  })

  it('logs out only the current cookie, and logout-all derives its owner solely from authentication', async () => {
    const base = await serve()
    const first = await createSession(userId)
    const second = await createSession(userId)
    const other = await createSession(otherId)
    const headers = { cookie: cookie(first.token), origin: config.appOrigin }
    const blocked = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { ...headers, origin: 'https://foreign.example' } })
    expect(blocked.status).toBe(403)
    expect(await validateSession(first.token)).not.toBeNull()
    let response = await fetch(base + '/api/auth/logout', { method: 'POST', headers })
    expect(response.status).toBe(204)
    expect((response.headers.get('set-cookie') ?? '').includes('Expires=Thu, 01 Jan 1970')).toBe(true)
    expect(await validateSession(first.token)).toBeNull()
    expect(await validateSession(second.token)).not.toBeNull()
    expect((await fetch(base + '/api/auth/logout', { method: 'POST', headers })).status).toBe(204)
    response = await fetch(base + '/api/auth/logout-all?userId=' + otherId, { method: 'POST', headers: { cookie: cookie(second.token), origin: config.appOrigin, 'content-type': 'application/json' }, body: JSON.stringify({ userId: otherId }) })
    expect(response.status).toBe(204)
    expect(await validateSession(second.token)).toBeNull()
    expect(await validateSession(other.token)).not.toBeNull()
    expect((await fetch(base + '/api/auth/logout-all', { method: 'POST', headers: { origin: config.appOrigin } })).status).toBe(401)
  })

  it('clears expired/revoked cookies and rejects missing users without minting or accepting a session', async () => {
    const base = await serve()
    const issued = await createSession(userId)
    await revokeSession(issued.token)
    let response = await fetch(base + '/api/auth/session', { headers: { cookie: cookie(issued.token) } })
    expect(await response.json()).toEqual({ authenticated: false, user: null })
    expect(response.headers.has('set-cookie')).toBe(true)
    const expired = await createSession(userId)
    await Session.updateOne({ _id: expired.sessionId }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
    response = await fetch(base + '/api/auth/session', { headers: { cookie: cookie(expired.token) } })
    expect(await response.json()).toEqual({ authenticated: false, user: null })
    expect(response.headers.has('set-cookie')).toBe(true)
    const records = await Session.countDocuments()
    await User.deleteOne({ _id: userId })
    response = await fetch(base + '/fixture/verified-login')
    expect(response.status).toBe(500)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(await Session.countDocuments()).toBe(records)
  })

  it('runs the administrative revocation script without printing tokens and closes its database process', async () => {
    const first = await createSession(userId)
    const other = await createSession(otherId)
    const result = await execute('npm', ['run', 'sessions:revoke-user', '--', userId.toHexString()], {
      cwd: process.cwd(), env: { ...process.env, MONGODB_URI: testUri! }, timeout: 15000,
    })
    expect(result.stdout.includes('Revoked 1 session(s).')).toBe(true)
    expect(result.stdout.includes(first.token) || result.stderr.includes(first.token)).toBe(false)
    expect(await validateSession(first.token)).toBeNull()
    expect(await validateSession(other.token)).not.toBeNull()
    try {
      await execute(process.execPath, ['dist-server/src/server/scripts/revoke-user-sessions.js', 'invalid'], {
        cwd: process.cwd(), env: { ...process.env, MONGODB_URI: testUri! }, timeout: 10000,
      })
      throw new Error('Expected invalid-ID rejection')
    } catch (error) {
      const failed = error as { code: number; stdout: string; stderr: string }
      expect(failed.code).toBe(1)
      expect(failed.stdout).toBe('')
      expect(failed.stderr.includes('Unable to revoke sessions.')).toBe(true)
    }
  }, 20000)
})
