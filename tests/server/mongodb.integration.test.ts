import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { AddressInfo } from 'node:net'
import mongoose, { type Connection, type Model } from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectDatabase, closeDatabase, pingDatabase } from '../../src/server/lib/db.js'
import { getReadyUserModel, getUserModel, type UserRecord } from '../../src/server/models/User.js'
import { findOrCreateOAuthUser, type VerifiedOAuthProfile } from '../../src/server/auth/oauth-user.js'
import { onVerifiedOAuthCallback } from '../../src/server/examples/oauth-callback.js'
import { startServer } from '../../src/server/index.js'

const execute = promisify(execFile)
const testUri = process.env.TEST_MONGODB_URI
// This suite deletes fixtures. Never accept an arbitrary developer/Atlas database.
if (testUri) {
  const uri = new URL(testUri)
  if (uri.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(uri.hostname)
    || uri.pathname !== '/first_light_backend_test' || uri.username || uri.password) {
    throw new Error('TEST_MONGODB_URI must point to a disposable loopback first_light_backend_test database without credentials.')
  }
}

describe.skipIf(!testUri)('real MongoDB identity storage and lifecycle', () => {
  let connection: Connection
  let User: Model<UserRecord>
  beforeAll(async () => {
    vi.stubEnv('MONGODB_URI', testUri!)
    vi.stubEnv('HOST', '127.0.0.1')
    vi.stubEnv('PORT', '3001')
    connection = await connectDatabase()
    expect(connection.name).toBe('first_light_backend_test')
    await connection.dropDatabase()
  }, 15000)
  beforeEach(async () => {
    connection = await connectDatabase()
    User = await getReadyUserModel()
    await User.deleteMany({})
  })
  afterAll(async () => {
    try {
      connection = await connectDatabase()
      await connection.dropDatabase()
    } finally {
      await closeDatabase()
      vi.unstubAllEnvs()
    }
  }, 15000)

  it('shares one live connection/model and installs the authoritative identity index', async () => {
    const values = await Promise.all(Array.from({ length: 20 }, connectDatabase))
    expect(values.every(value => value === connection)).toBe(true)
    expect(mongoose.connections.filter(value => value.readyState === 1)).toHaveLength(1)
    expect(getUserModel(connection)).toBe(User)
    expect(await getReadyUserModel()).toBe(User)
    const index = (await User.collection.indexes()).find(value => value.name === 'unique_oauth_identity')
    expect(index?.unique).toBe(true)
    expect(index?.key).toEqual({ 'identities.provider': 1, 'identities.providerAccountId': 1 })
    await pingDatabase()
  })

  it('keeps twenty simultaneous first logins on one timestamped user and preserves opaque IDs', async () => {
    const profile = { provider: 'google', providerAccountId: ' SubjectCase ', email: '  Person@Example.org ', name: 'Researcher', image: 'https://example.org/avatar.png' }
    const users = await Promise.all(Array.from({ length: 20 }, () => findOrCreateOAuthUser(profile)))
    expect(new Set(users.map(value => value.id)).size).toBe(1)
    expect(await User.countDocuments()).toBe(1)
    expect(users[0].toObject().identities).toEqual([{ provider: 'google', providerAccountId: ' SubjectCase ' }])
    expect(users[0].email).toBe('person@example.org')
    expect(users[0].createdAt).toBeInstanceOf(Date)
    expect(users[0].updatedAt).toBeInstanceOf(Date)
    const other = await findOrCreateOAuthUser({ provider: 'google', providerAccountId: ' subjectcase ' })
    expect(other.id).not.toBe(users[0].id)
  })

  it('never merges matching emails across identities and retains missing profile fields', async () => {
    const original = await findOrCreateOAuthUser({ provider: 'google', providerAccountId: 'one', email: 'same@example.org', name: 'Original', image: 'https://example.org/a.png' })
    const unrelated = await findOrCreateOAuthUser({ provider: 'github', providerAccountId: 'one', email: 'same@example.org' })
    expect(unrelated.id).not.toBe(original.id)
    const changed = await findOrCreateOAuthUser({ provider: 'google', providerAccountId: 'one', name: 'Updated' })
    expect(changed.id).toBe(original.id)
    expect(changed.name).toBe('Updated')
    expect(changed.email).toBe(original.email)
    expect(changed.image).toBe(original.image)
    expect(changed.createdAt.getTime()).toBe(original.createdAt.getTime())
    expect(changed.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime())
    expect(await User.countDocuments()).toBe(2)
  })

  it('supports linked providers without cross-pair matches or identity reassignment', async () => {
    const linked = await User.create({ name: 'Linked', identities: [{ provider: 'google', providerAccountId: 'alpha' }, { provider: 'github', providerAccountId: 'beta' }] })
    const found = await findOrCreateOAuthUser({ provider: 'github', providerAccountId: 'beta' })
    expect(found.id).toBe(linked.id)
    expect(found.identities).toHaveLength(2)
    const crossed = await findOrCreateOAuthUser({ provider: 'google', providerAccountId: 'beta' })
    expect(crossed.id).not.toBe(linked.id)
    await expect(User.create({ identities: [{ provider: 'github', providerAccountId: 'beta' }] })).rejects.toMatchObject({ code: 11000 })
    await expect(User.create({ identities: [{ provider: 'google', providerAccountId: 'duplicate' }, { provider: 'google', providerAccountId: 'duplicate' }] })).rejects.toMatchObject({ name: 'ValidationError' })
    expect(await User.countDocuments()).toBe(2)
  })

  it('rejects invalid identities/operators and ignores non-profile mass assignment', async () => {
    const invalid = [
      { provider: '', providerAccountId: 'x' },
      { provider: 'google', providerAccountId: '   ' },
      { provider: { $ne: '' }, providerAccountId: 'x' },
      { provider: 'google', providerAccountId: 'x', email: { $set: 'fake' } },
      { provider: 'google', providerAccountId: 'x', image: 'javascript:alert(1)' },
    ]
    for (const profile of invalid) {
      await expect(findOrCreateOAuthUser(profile as unknown as VerifiedOAuthProfile)).rejects.toBeInstanceOf(TypeError)
    }
    expect(await User.countDocuments()).toBe(0)
    const user = await findOrCreateOAuthUser({ provider: 'google', providerAccountId: 'safe', role: 'admin', password: 'fake' } as unknown as VerifiedOAuthProfile)
    expect(user.toObject()).not.toHaveProperty('role')
    expect(user.toObject()).not.toHaveProperty('password')
    await expect(User.create({ identities: [] })).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('maps a trusted verified-callback result to the same stored user', async () => {
    const first = await onVerifiedOAuthCallback('google', { sub: 'verified-subject', email: 'verified@example.org', name: 'Verified', picture: 'https://example.org/photo.png' })
    const again = await onVerifiedOAuthCallback('google', { sub: 'verified-subject' })
    expect(again.id).toBe(first.id)
    expect(again.image).toBe('https://example.org/photo.png')
    expect(await User.countDocuments()).toBe(1)
  })

  it('unregisters owned pools after shutdown, stale replacement and failed attempts', async () => {
    const original = connection
    await closeDatabase()
    expect(mongoose.connections).not.toContain(original)
    connection = await connectDatabase()
    const stale = connection
    await stale.close()
    connection = await connectDatabase()
    expect(mongoose.connections).not.toContain(stale)
    await closeDatabase()
    const registered = mongoose.connections.length
    vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:1/first_light_backend_test')
    try {
      await expect(connectDatabase()).rejects.toThrow('Unable to connect to MongoDB.')
      expect(mongoose.connections).toHaveLength(registered)
    } finally { vi.stubEnv('MONGODB_URI', testUri!) }
  }, 15000)

  it('replaces a closed real pool and recovers after an actual failed connection', async () => {
    const first = connection
    await first.close()
    connection = await connectDatabase()
    expect(connection).not.toBe(first)
    expect(first.readyState).toBe(0)
    await closeDatabase()
    vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:1/first_light_backend_test')
    await expect(connectDatabase()).rejects.toThrow('Unable to connect to MongoDB.')
    vi.stubEnv('MONGODB_URI', testUri!)
    connection = await connectDatabase()
    expect(connection.readyState).toBe(1)
    User = await getReadyUserModel()
    expect(mongoose.connections.filter(value => value.readyState === 1)).toHaveLength(1)
  }, 15000)

  it('runs real readiness, closes the server/pool idempotently and removes signal handlers', async () => {
    const sigint = process.listenerCount('SIGINT')
    const sigterm = process.listenerCount('SIGTERM')
    const running = await startServer({ port: 0 })
    try {
      const base = 'http://127.0.0.1:' + (running.server.address() as AddressInfo).port
      expect((await fetch(base + '/health')).status).toBe(200)
      const ready = await fetch(base + '/ready')
      expect(ready.status).toBe(200)
      expect(await ready.json()).toEqual({ status: 'ready' })
      expect(process.listenerCount('SIGINT')).toBe(sigint + 1)
      expect(process.listenerCount('SIGTERM')).toBe(sigterm + 1)
      const blocked = await fetch(base + '/users', { method: 'POST', body: JSON.stringify({ provider: 'google', providerAccountId: 'forged' }) })
      expect(blocked.status).toBe(404)
      expect(await User.countDocuments()).toBe(0)
      const stopping = running.stop()
      expect(running.stop()).toBe(stopping)
      await stopping
      expect(running.server.listening).toBe(false)
      expect(connection.readyState).toBe(0)
      expect(process.listenerCount('SIGINT')).toBe(sigint)
      expect(process.listenerCount('SIGTERM')).toBe(sigterm)
    } finally { await running.stop() }
  })

  it('cleans the shared pool if binding fails without installing signal listeners', async () => {
    const running = await startServer({ port: 0 })
    const port = (running.server.address() as AddressInfo).port
    const sigint = process.listenerCount('SIGINT')
    const sigterm = process.listenerCount('SIGTERM')
    try {
      await expect(startServer({ port })).rejects.toThrow('Unable to start the API server.')
      expect(process.listenerCount('SIGINT')).toBe(sigint)
      expect(process.listenerCount('SIGTERM')).toBe(sigterm)
      expect(connection.readyState).toBe(0)
    } finally { await running.stop() }
  })

  it('executes the compiled read-only connection check and sanitizes failure output', async () => {
    const before = await connection.db!.listCollections().toArray()
    const checked = await execute(process.execPath, ['dist-server/src/server/scripts/check-db.js'], { cwd: process.cwd(), env: { ...process.env, MONGODB_URI: testUri! }, timeout: 10000 })
    expect(checked.stdout).toContain('MongoDB ping succeeded.')
    expect(checked.stderr).toBe('')
    expect(await User.countDocuments()).toBe(0)
    expect(await connection.db!.listCollections().toArray()).toEqual(before)
    try {
      await execute(process.execPath, ['dist-server/src/server/scripts/check-db.js'], { cwd: process.cwd(), env: { ...process.env, MONGODB_URI: 'https://fake_user:fake_password@fake.invalid/db' }, timeout: 10000 })
      throw new Error('Expected configuration rejection')
    } catch (error) {
      const failure = error as { code: number; stdout: string; stderr: string }
      expect(failure.code).toBe(1)
      expect(failure.stdout).toBe('')
      expect(failure.stderr).toContain('MongoDB ping failed.')
      expect(failure.stderr).not.toMatch(/fake_password|fake_user|fake\.invalid|https:/)
    }
  })
})
