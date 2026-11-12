import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Types, type Connection } from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectDatabase, closeDatabase } from '../../src/server/lib/db.js'
import { getReadyUserModel } from '../../src/server/models/User.js'
import { getReadySessionModel } from '../../src/server/models/Session.js'
import { getReadyResearchWorkspaceModel } from '../../src/server/models/ResearchWorkspace.js'
import { createSession, revokeSession } from '../../src/server/auth/sessions.js'
import { createApp } from '../../src/server/app.js'
import { MAX_JSON_BYTES } from '../../src/server/http/json.js'
import type { SessionConfig } from '../../src/server/lib/session-config.js'
import type { Workspace } from '../../src/workspace.js'

const uri = process.env.TEST_MONGODB_URI
if (uri) {
  const parsed = new URL(uri)
  if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
    || parsed.pathname !== '/first_light_backend_test' || parsed.username || parsed.password) {
    throw new Error('Research tests require a disposable loopback first_light_backend_test database without credentials.')
  }
}
const config: SessionConfig = { appOrigin: 'http://127.0.0.1:3001', cookieName: 'first-light-session', secure: false, ttlMs: 86400000 }
const source = (id = 'source-a') => ({ id, title: 'A research paper', url: 'https://example.org/paper', notes: '', createdAt: '2026-11-12T00:00:00.000Z' })
const workspace = (id = 'source-a'): Workspace => ({ version: 1, sources: [source(id)], decisions: [] })
interface Identity { id: string; token: string }

describe.skipIf(!uri)('real MongoDB owner-scoped research API', () => {
  let connection: Connection
  let server: Server
  let base: string
  let a: Identity
  let b: Identity
  beforeAll(async () => {
    vi.stubEnv('MONGODB_URI', uri!)
    connection = await connectDatabase()
    expect(connection.name).toBe('first_light_backend_test')
    await connection.dropDatabase()
  }, 15000)
  beforeEach(async () => {
    const User = await getReadyUserModel()
    const Session = await getReadySessionModel()
    const Research = await getReadyResearchWorkspaceModel()
    await Promise.all([User.deleteMany({}), Session.deleteMany({}), Research.deleteMany({})])
    const make = async (subject: string): Promise<Identity> => {
      const user = await User.create({ name: subject, identities: [{ provider: 'fixture', providerAccountId: subject }] })
      const issued = await createSession(user._id)
      return { id: user.id, token: issued.token }
    }
    a = await make('User A'); b = await make('User B')
    server = createServer(createApp(async () => {}, config))
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port
  })
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
      server.closeIdleConnections()
    })
  })
  afterAll(async () => {
    try { if (connection?.readyState === 1) await connection.dropDatabase() }
    finally { await closeDatabase(); vi.unstubAllEnvs() }
  }, 15000)

  function call(path: string, identity: Identity | null, method = 'GET', body?: unknown, extra: Record<string, string> = {}) {
    return fetch(base + path, {
      method,
      headers: {
        ...(identity ? { cookie: config.cookieName + '=' + identity.token, 'X-First-Light-Account': identity.id } : {}),
        ...(method === 'GET' || method === 'HEAD' || method === 'OPTIONS' ? {} : { origin: config.appOrigin, 'content-type': 'application/json' }),
        ...extra,
      },
      ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    })
  }
  const save = (identity: Identity, value = workspace(), revision = 0) => call('/api/research', identity, 'PUT', { workspace: value, expectedRevision: revision })

  it('requires a live session for every protected route and exact origin for mutations', async () => {
    for (const [path, method] of [['/api/research', 'GET'], ['/api/research', 'PUT'], ['/api/research/import', 'POST']]) {
      expect((await call(path!, null, method, method === 'GET' ? undefined : {})).status).toBe(401)
    }
    expect((await call('/api/research', a, 'PUT', {}, { origin: 'https://foreign.example' })).status).toBe(403)
    expect(await (await getReadyResearchWorkspaceModel()).countDocuments()).toBe(0)
    await revokeSession(a.token)
    expect((await call('/api/research', a)).status).toBe(401)
    expect((await call('/api/research/import', a, 'POST', {})).status).toBe(401)
    await (await getReadySessionModel()).updateMany({ userId: new Types.ObjectId(b.id) }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await call('/api/research', b)).status).toBe(401)
  })

  it('keys every document and query to the authenticated owner despite supplied query IDs', async () => {
    expect(await (await call('/api/research', a)).json()).toEqual({ workspace: { version: 1, sources: [], decisions: [] }, revision: 0 })
    expect((await save(a)).status).toBe(200)
    expect(await (await call('/api/research?userId=' + a.id + '&ownerId=' + a.id, b)).json()).toEqual({ workspace: { version: 1, sources: [], decisions: [] }, revision: 0 })
    const forged = await call('/api/research', b, 'PUT', { workspace: workspace('b'), expectedRevision: 0, ownerId: a.id })
    expect(forged.status).toBe(400)
    expect((await save(b, workspace('source-b'))).status).toBe(200)
    expect((await (await call('/api/research?userId=' + b.id, a)).json()).workspace).toEqual(workspace())
    const model = await getReadyResearchWorkspaceModel()
    const docs = await model.find({}).lean()
    expect(docs).toHaveLength(2)
    expect(new Set(docs.map(doc => String(doc.ownerId)))).toEqual(new Set([a.id, b.id]))
    expect((await model.collection.indexes()).find(index => index.name === 'unique_research_owner')?.unique).toBe(true)
  })

  it('rejects stale account snapshots after a cookie switches even when revisions coincide', async () => {
    await save(a); await save(b, workspace('source-b'))
    for (const [path, method] of [['/api/research', 'GET'], ['/api/research', 'PUT'], ['/api/research/import', 'POST']]) {
      const response = await call(path!, b, method, method === 'GET' ? undefined : { workspace: workspace('a-new'), expectedRevision: 1 }, { 'X-First-Light-Account': a.id })
      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: 'Account changed. Refresh session.' })
    }
    const missing = await fetch(base + '/api/research', { method: 'PUT', headers: { cookie: config.cookieName + '=' + b.token, origin: config.appOrigin, 'content-type': 'application/json' }, body: JSON.stringify({ workspace: workspace(), expectedRevision: 1 }) })
    expect(missing.status).toBe(409)
    const simpleGet = await fetch(base + '/api/research', { headers: { cookie: config.cookieName + '=' + b.token } })
    expect(simpleGet.status).toBe(200)
    expect((await simpleGet.json()).workspace).toEqual(workspace('source-b'))
  })

  it('atomically rejects simultaneous first writes and stale subsequent replacements', async () => {
    const initial = await Promise.all([save(a, workspace('one')), save(a, workspace('two'))])
    expect(initial.map(response => response.status).sort()).toEqual([200, 409])
    expect(await (await getReadyResearchWorkspaceModel()).countDocuments({ ownerId: new Types.ObjectId(a.id) })).toBe(1)
    const updates = await Promise.all([save(a, workspace('three'), 1), save(a, workspace('four'), 1)])
    expect(updates.map(response => response.status).sort()).toEqual([200, 409])
    const result = await (await call('/api/research', a)).json()
    expect(result.revision).toBe(2)
    expect(['three', 'four']).toContain(result.workspace.sources[0].id)
    expect((await save(a, workspace('lost'), 1)).status).toBe(409)
    expect(await (await call('/api/research', a)).json()).toEqual(result)
  })

  it('imports explicitly, merges sources and dependent decisions atomically, and skips exact duplicates', async () => {
    await save(a)
    const incoming = workspace('imported')
    incoming.decisions.push({ id: 'decision-a', sourceId: 'imported', finding: 'Useful evidence', implementation: 'Build this', status: 'planned', createdAt: source().createdAt })
    const request = { workspace: incoming, expectedRevision: 1 }
    const imported = await call('/api/research/import', a, 'POST', request)
    expect(imported.status).toBe(200)
    const first = await imported.json()
    expect(first.imported).toEqual({ sources: 1, decisions: 1 })
    expect(first.workspace.sources.map((value: { id: string }) => value.id)).toEqual(['source-a', 'imported'])
    expect(first.workspace.decisions).toEqual(incoming.decisions)
    const duplicate = await call('/api/research/import', a, 'POST', { ...request, expectedRevision: 2 })
    expect(await duplicate.json()).toEqual({ ...first, imported: { sources: 0, decisions: 0 } })
    expect((await call('/api/research/import', a, 'POST', request)).status).toBe(409)
    const reordered = { ...incoming, sources: [{ createdAt: source().createdAt, notes: '', url: source().url, title: source().title, id: 'imported' }] }
    expect((await call('/api/research/import', a, 'POST', { workspace: reordered, expectedRevision: 2 })).status).toBe(200)
  })

  it('rejects conflicting and cross-type IDs without overwriting any account research', async () => {
    await save(a)
    const changed = workspace(); changed.sources[0]!.notes = 'Different local edit'
    expect((await call('/api/research/import', a, 'POST', { workspace: changed, expectedRevision: 1 })).status).toBe(409)
    const crossType = workspace('new-source')
    crossType.decisions.push({ id: 'source-a', sourceId: 'new-source', finding: 'A finding', implementation: 'Build', status: 'planned', createdAt: source().createdAt })
    expect((await call('/api/research/import', a, 'POST', { workspace: crossType, expectedRevision: 1 })).status).toBe(409)
    expect(await (await call('/api/research', a)).json()).toEqual({ workspace: workspace(), revision: 1 })
  })

  it('rejects unsafe JSON, excessive bodies and invalid relationships before writing', async () => {
    const headers = { 'content-type': 'text/plain' }
    expect((await call('/api/research', a, 'PUT', '{}', headers)).status).toBe(415)
    expect((await call('/api/research', a, 'PUT', '{broken')).status).toBe(400)
    expect((await call('/api/research', a, 'PUT', 'x'.repeat(MAX_JSON_BYTES + 1))).status).toBe(413)
    const nested = workspace(); Object.assign(nested.sources[0]!, { $set: { ownerId: b.id } })
    expect((await save(a, nested)).status).toBe(400)
    const invalid = workspace(); invalid.sources[0]!.url = 'javascript:alert(1)'
    expect((await save(a, invalid)).status).toBe(400)
    expect(await (await getReadyResearchWorkspaceModel()).countDocuments()).toBe(0)
  })

  it('keeps protected responses uncached, supports HEAD/OPTIONS and rejects unrelated methods', async () => {
    await save(a)
    const get = await call('/api/research', a)
    expect(get.headers.get('cache-control')).toBe('no-store')
    expect(get.headers.get('vary')).toContain('Cookie')
    const result = await get.json()
    expect(Object.keys(result).sort()).toEqual(['revision', 'workspace'])
    const head = await call('/api/research', a, 'HEAD')
    expect(head.status).toBe(200); expect(await head.text()).toBe('')
    expect((await call('/api/research', a, 'OPTIONS')).headers.get('allow')).toBe('GET, HEAD, PUT')
    expect((await call('/api/research', a, 'DELETE')).status).toBe(405)
    expect((await call('/api/research/import', a)).status).toBe(405)
  })

  it('logout revokes access to research without removing the saved document', async () => {
    await save(a)
    expect((await call('/api/auth/logout', a, 'POST')).status).toBe(204)
    expect((await call('/api/research', a)).status).toBe(401)
    expect((await save(a, workspace('overwrite'), 1)).status).toBe(401)
    expect(await (await getReadyResearchWorkspaceModel()).countDocuments({ ownerId: new Types.ObjectId(a.id) })).toBe(1)
  })
})
