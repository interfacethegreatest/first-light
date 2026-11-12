import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readSessionConfig, readSessionLifetimeMs, type SessionConfig } from '../../src/server/lib/session-config.js'

const storage = vi.hoisted(() => ({
  createSession: vi.fn(), validateSession: vi.fn(), revokeSession: vi.fn(), revokeAllUserSessions: vi.fn(),
}))
vi.mock('../../src/server/auth/sessions.js', () => storage)

import { createApp } from '../../src/server/app.js'
import { apiHandler, sendJson } from '../../src/server/http/response.js'
import { establishVerifiedSession, readSessionCookie, requireSession } from '../../src/server/auth/session-http.js'

const token = 'a'.repeat(64)
const config: SessionConfig = { appOrigin: 'http://127.0.0.1:3001', cookieName: 'first-light-session', secure: false, ttlMs: 86400000 }
const principal = { sessionId: 'session', userId: '0123456789abcdef01234567', expiresAt: new Date(Date.now() + 86400000), user: { id: '0123456789abcdef01234567', name: 'Fixture' } }
const servers: Server[] = []

async function serve(app = createApp(async () => {}, config)) {
  const server = createServer(app)
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return 'http://127.0.0.1:' + (server.address() as AddressInfo).port
}

beforeEach(() => {
  for (const mock of Object.values(storage)) mock.mockReset()
  storage.validateSession.mockResolvedValue(null)
  storage.revokeSession.mockResolvedValue(false)
  storage.revokeAllUserSessions.mockResolvedValue(0)
})
afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeIdleConnections()
  })))
})

describe('session HTTP configuration and boundaries', () => {
  it('bounds lifetimes and requires a trusted HTTPS production origin', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('APP_ORIGIN', undefined)
    vi.stubEnv('SESSION_TTL_DAYS', undefined)
    expect(readSessionLifetimeMs()).toBe(30 * 86400000)
    expect(readSessionConfig()).toMatchObject({ appOrigin: 'http://127.0.0.1:3001', secure: false, cookieName: 'first-light-session' })
    for (const invalid of ['0', '-1', '1.5', '366', 'abc', '']) {
      vi.stubEnv('SESSION_TTL_DAYS', invalid)
      expect(() => readSessionLifetimeMs()).toThrow('SESSION_TTL_DAYS')
    }
    vi.stubEnv('SESSION_TTL_DAYS', '7')
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => readSessionConfig()).toThrow('APP_ORIGIN')
    for (const origin of ['http://127.0.0.1:3001', 'http://site.example', 'https://site.example/path', 'https://u:p@site.example', 'null', '*']) {
      vi.stubEnv('APP_ORIGIN', origin)
      expect(() => readSessionConfig()).toThrow('APP_ORIGIN')
    }
    vi.stubEnv('APP_ORIGIN', 'https://site.example')
    expect(readSessionConfig()).toEqual({ appOrigin: 'https://site.example', secure: true, cookieName: '__Host-first-light-session', ttlMs: 7 * 86400000 })
  })

  it('rejects ambiguous, malformed and oversized cookies without accepting alternate credentials', () => {
    const read = (cookie?: string) => readSessionCookie({ headers: { cookie } } as IncomingMessage, config)
    expect(read()).toEqual({ present: false, token: null })
    expect(read('other=value')).toEqual({ present: false, token: null })
    expect(read('other=value; first-light-session=' + token)).toEqual({ present: true, token })
    for (const value of ['short', '%ZZ', 'A'.repeat(64), token + '; first-light-session=' + token]) {
      expect(read('first-light-session=' + value)).toEqual({ present: true, token: null })
    }
    expect(read('first-light-session=' + 'x'.repeat(8193))).toEqual({ present: true, token: null })
  })

  it('reports anonymous status without issuing a cookie and never serializes credentials', async () => {
    const base = await serve()
    let response = await fetch(base + '/api/auth/session', { headers: { authorization: 'Bearer ' + token } })
    expect(await response.json()).toEqual({ authenticated: false, user: null })
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(storage.validateSession).toHaveBeenLastCalledWith(null)
    storage.validateSession.mockResolvedValue(principal)
    response = await fetch(base + '/api/auth/session', { headers: { cookie: 'first-light-session=' + token } })
    const body = await response.json()
    expect(body).toEqual({ authenticated: true, user: principal.user, expiresAt: principal.expiresAt.toISOString() })
    expect(JSON.stringify(body).includes(token)).toBe(false)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('vary')).toContain('Cookie')
  })

  it('clears rejected cookies but preserves them during storage failures', async () => {
    const base = await serve()
    let response = await fetch(base + '/api/auth/session', { headers: { cookie: 'first-light-session=bad' } })
    expect((response.headers.get('set-cookie') ?? '').includes('Expires=Thu, 01 Jan 1970')).toBe(true)
    storage.validateSession.mockRejectedValue(new Error('mongodb://fake:fake-secret@fake.invalid/private'))
    response = await fetch(base + '/api/auth/session', { headers: { cookie: 'first-light-session=' + token } })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Session service unavailable.' })
    expect(response.headers.has('set-cookie')).toBe(false)
  })

  it('blocks missing/null/foreign origins and spoofed Host headers before revocation', async () => {
    const base = await serve()
    for (const path of ['/logout', '/logout-all']) {
      for (const origin of [undefined, 'null', 'https://foreign.example', config.appOrigin + '.evil']) {
        const headers: Record<string, string> = { cookie: 'first-light-session=' + token, host: '127.0.0.1:3001', 'x-forwarded-proto': 'https' }
        if (origin) headers.origin = origin
        const response = await fetch(base + '/api/auth' + path, { method: 'POST', headers })
        expect(response.status).toBe(403)
      }
    }
    expect(storage.revokeSession).not.toHaveBeenCalled()
    expect(storage.revokeAllUserSessions).not.toHaveBeenCalled()
    expect(storage.validateSession).not.toHaveBeenCalled()
  })

  it('uses only the authenticated owner for logout-all and fails closed without dropping cookies on DB errors', async () => {
    const base = await serve()
    let response = await fetch(base + '/api/auth/logout-all', { method: 'POST', headers: { origin: config.appOrigin } })
    expect(response.status).toBe(401)
    storage.validateSession.mockResolvedValue(principal)
    response = await fetch(base + '/api/auth/logout-all?userId=other', { method: 'POST', headers: { origin: config.appOrigin, cookie: 'first-light-session=' + token, 'content-type': 'application/json' }, body: JSON.stringify({ userId: 'other' }) })
    expect(response.status).toBe(204)
    expect(storage.revokeAllUserSessions).toHaveBeenLastCalledWith(principal.userId)
    storage.revokeSession.mockRejectedValue(new Error('private storage details'))
    response = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { origin: config.appOrigin, cookie: 'first-light-session=' + token } })
    expect(response.status).toBe(503)
    expect(response.headers.has('set-cookie')).toBe(false)
  })

  it('passes a verified principal to protected handlers and lets the generic boundary handle handler errors', async () => {
    const protectedHandler = requireSession((request, response, session) => { sendJson(request, response, 200, { ownerId: session.userId }) }, config)
    const failureHandler = requireSession(async () => { throw new Error('private handler details') }, config)
    const fallback = createApp(async () => {}, config)
    const app = apiHandler(null, async (request, response) => {
      const path = new URL(request.url ?? '/', 'http://local.invalid').pathname
      await (path === '/protected' ? protectedHandler : path === '/failure' ? failureHandler : fallback)(request, response)
    })
    const base = await serve(app)
    expect((await fetch(base + '/protected')).status).toBe(401)
    storage.validateSession.mockResolvedValue(principal)
    const good = await fetch(base + '/protected?userId=other', { headers: { cookie: 'first-light-session=' + token } })
    expect(await good.json()).toEqual({ ownerId: principal.userId })
    const failed = await fetch(base + '/failure', { headers: { cookie: 'first-light-session=' + token } })
    expect(failed.status).toBe(500)
    expect(await failed.json()).toEqual({ error: 'Internal server error' })
  })

  it('uses persistent Secure host-only cookies and rolls back unissued sessions when rotation or cookie writing fails', async () => {
    const issued = { token: 'b'.repeat(64), sessionId: 'new', userId: principal.userId, expiresAt: new Date(Date.now() + 60000) }
    storage.createSession.mockResolvedValue(issued)
    const request = { headers: { cookie: 'first-light-session=' + token } } as IncomingMessage
    const headers = new Map<string, string | string[] | number>([['Set-Cookie', 'provider-state=retained; HttpOnly']])
    const setHeader = vi.fn((name: string, value: string | string[] | number) => { headers.set(name, value) })
    const response = { headersSent: false, setHeader, getHeader: (name: string) => headers.get(name) } as unknown as ServerResponse
    const https: SessionConfig = { ...config, cookieName: '__Host-first-light-session', secure: true, appOrigin: 'https://site.example' }
    const safe = await establishVerifiedSession({ headers: {} } as IncomingMessage, response, principal.userId, https)
    expect(safe).toEqual({ sessionId: 'new', userId: principal.userId, expiresAt: issued.expiresAt })
    const cookies = headers.get('Set-Cookie') as string[]
    expect(cookies[0]).toBe('provider-state=retained; HttpOnly')
    const issuedCookie = cookies[1]!
    expect(issuedCookie.startsWith('__Host-first-light-session=' + issued.token)).toBe(true)
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Expires=' + issued.expiresAt.toUTCString()]) expect(issuedCookie).toContain(flag)
    expect(issuedCookie).not.toContain('Domain=')
    const maxAge = Number(issuedCookie.match(/Max-Age=(\d+)/)?.[1])
    expect(maxAge > 50 && maxAge <= 60).toBe(true)
    storage.revokeSession.mockRejectedValueOnce(new Error('rotation failed')).mockResolvedValueOnce(true)
    await expect(establishVerifiedSession(request, response, principal.userId, config)).rejects.toThrow('rotation failed')
    expect(storage.revokeSession).toHaveBeenLastCalledWith(issued.token)
    let rejectCookie = true
    setHeader.mockImplementation((name: string, value: string | string[] | number) => {
      if (name === 'Set-Cookie' && rejectCookie) {
        rejectCookie = false
        throw new Error('cookie failed')
      }
      headers.set(name, value)
    })
    await expect(establishVerifiedSession(request, response, principal.userId, config)).rejects.toThrow('cookie failed')
    expect(storage.revokeSession).toHaveBeenLastCalledWith(issued.token)
    await expect(establishVerifiedSession(request, { headersSent: true } as ServerResponse, principal.userId, config)).rejects.toThrow('before sending')
    expect(storage.createSession).toHaveBeenCalledTimes(3)
  })
})
