import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiHandler } from '../../src/server/http/response.js'

const storage = vi.hoisted(() => ({
  validateSession: vi.fn(), revokeSession: vi.fn(), revokeAllUserSessions: vi.fn(), createSession: vi.fn(),
}))
const database = vi.hoisted(() => ({ pingDatabase: vi.fn() }))
vi.mock('../../src/server/auth/sessions.js', () => storage)
vi.mock('../../src/server/lib/db.js', () => database)

import health from '../../api/health.js'
import ready from '../../api/ready.js'
import session from '../../api/auth/session.js'
import logout from '../../api/auth/logout.js'
import logoutAll from '../../api/auth/logout-all.js'
import notFound from '../../api/not-found.js'

const token = 'a'.repeat(64)
const origin = 'http://127.0.0.1:3001'
const servers: Server[] = []
async function serve(handler: ApiHandler) {
  const server = createServer(handler)
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return 'http://127.0.0.1:' + (server.address() as AddressInfo).port
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('APP_ORIGIN', origin)
  vi.stubEnv('SESSION_TTL_DAYS', '30')
  for (const mock of [...Object.values(storage), ...Object.values(database)]) mock.mockReset()
  storage.validateSession.mockResolvedValue(null)
  storage.revokeSession.mockResolvedValue(false)
  storage.revokeAllUserSessions.mockResolvedValue(0)
  database.pingDatabase.mockResolvedValue(undefined)
})
afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeIdleConnections()
  })))
})

describe('classic Node API function exports', () => {
  it('executes health directly without database work and preserves HEAD/method/OPTIONS semantics', async () => {
    const base = await serve(health)
    const get = await fetch(base)
    expect(get.status).toBe(200)
    expect(await get.json()).toEqual({ status: 'ok' })
    expect(database.pingDatabase).not.toHaveBeenCalled()
    const head = await fetch(base, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    expect(head.headers.get('content-length')).toBe(get.headers.get('content-length'))
    const options = await fetch(base, { method: 'OPTIONS' })
    expect(options.status).toBe(200)
    expect(options.headers.get('allow')).toBe('GET, HEAD')
    expect(await options.text()).toBe('GET, HEAD')
    const wrong = await fetch(base, { method: 'POST' })
    expect(wrong.status).toBe(404)
    expect(await wrong.json()).toEqual({ error: 'Not found' })
  })

  it('uses the real default readiness boundary and sanitizes rejected database checks', async () => {
    const base = await serve(ready)
    expect(await (await fetch(base)).json()).toEqual({ status: 'ready' })
    expect(database.pingDatabase).toHaveBeenCalledTimes(1)
    database.pingDatabase.mockRejectedValue(new Error('mongodb://fake:secret@private.invalid/db'))
    const response = await fetch(base)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable' })
  })

  it('resolves configuration lazily and reports only safe profile/session data', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('APP_ORIGIN', undefined)
    // Imports above already succeeded without constructing an app/listener or reading secrets.
    const base = await serve(session)
    const missing = await fetch(base)
    expect(missing.status).toBe(500)
    expect(await missing.json()).toEqual({ error: 'Internal server error' })
    expect(storage.validateSession).not.toHaveBeenCalled()
    vi.stubEnv('APP_ORIGIN', 'https://site.example')
    const expiresAt = new Date(Date.now() + 60000)
    storage.validateSession.mockResolvedValue({ sessionId: 'private-id', userId: 'user-id', user: { id: 'user-id', name: 'Fixture' }, expiresAt })
    const response = await fetch(base, { headers: { cookie: '__Host-first-light-session=' + token } })
    expect(await response.json()).toEqual({ authenticated: true, user: { id: 'user-id', name: 'Fixture' }, expiresAt: expiresAt.toISOString() })
    expect(response.headers.get('vary')).toContain('Cookie')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('guards each mutation export and revokes only the authenticated owner', async () => {
    const single = await serve(logout)
    const all = await serve(logoutAll)
    expect((await fetch(single, { method: 'POST', headers: { origin: 'https://foreign.example' } })).status).toBe(403)
    expect(storage.revokeSession).not.toHaveBeenCalled()
    const good = await fetch(single, { method: 'POST', headers: { origin, cookie: 'first-light-session=' + token } })
    expect(good.status).toBe(204)
    expect(storage.revokeSession).toHaveBeenCalledWith(token)
    const options = await fetch(all, { method: 'OPTIONS' })
    expect(options.headers.get('allow')).toBe('POST')
    expect(await options.text()).toBe('POST')
    expect((await fetch(all, { method: 'POST', headers: { origin } })).status).toBe(401)
    storage.validateSession.mockResolvedValue({ userId: 'verified-user', user: { id: 'verified-user' }, expiresAt: new Date(Date.now() + 60000) })
    expect((await fetch(all + '?userId=other', { method: 'POST', headers: { origin, cookie: 'first-light-session=' + token }, body: '{"userId":"other"}' })).status).toBe(204)
    expect(storage.revokeAllUserSessions).toHaveBeenCalledWith('verified-user')
  })

  it('keeps the API fallback JSON404 for every method and records narrow deployment rewrites', async () => {
    const base = await serve(notFound)
    for (const method of ['GET', 'POST', 'OPTIONS']) {
      const response = await fetch(base + '/api/missing', { method })
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Not found' })
      expect(response.headers.get('content-type')).toContain('application/json')
    }
    const config = JSON.parse(await readFile('vercel.json', 'utf8'))
    expect(config).toMatchObject({ framework: 'vite', outputDirectory: 'dist' })
    expect(config.rewrites).toEqual([
      { source: '/health', destination: '/api/health' },
      { source: '/ready', destination: '/api/ready' },
      { source: '/api/:path*', destination: '/api/not-found' },
    ])
    expect(JSON.stringify(config)).not.toContain('index.html')
    // Actual Vercel route precedence/import tracing requires a future platform Preview.
  })
})
