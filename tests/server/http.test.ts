import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/server/app.js'

const servers: Server[] = []
async function serve(checkDatabase: () => Promise<void>) {
  const server = createServer(createApp(checkDatabase))
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return 'http://127.0.0.1:' + (server.address() as AddressInfo).port
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeIdleConnections()
  })))
})

describe('minimal API boundary', () => {
  it('keeps liveness independent from MongoDB and reports readiness only after a ping', async () => {
    const check = vi.fn(async () => {})
    const base = await serve(check)
    const health = await fetch(base + '/health')
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ status: 'ok' })
    expect(check).not.toHaveBeenCalled()
    expect(health.headers.has('x-powered-by')).toBe(false)
    expect(health.headers.get('cache-control')).toBe('no-store')
    const ready = await fetch(base + '/ready')
    expect(ready.status).toBe(200)
    expect(await ready.json()).toEqual({ status: 'ready' })
    expect(check).toHaveBeenCalledTimes(1)
  })

  it('returns generic failures and exposes no client-asserted identity-write route', async () => {
    const check = vi.fn(async () => { throw new Error('mongodb://fake_user:fake_password@fake.invalid/private') })
    const base = await serve(check)
    const ready = await fetch(base + '/ready')
    expect(ready.status).toBe(503)
    expect(await ready.json()).toEqual({ status: 'unavailable' })
    for (const path of ['/users', '/auth/callback', '/oauth/callback']) {
      const response = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'google', providerAccountId: 'forged' }) })
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Not found' })
    }
    expect(check).toHaveBeenCalledTimes(1)
  })
})
