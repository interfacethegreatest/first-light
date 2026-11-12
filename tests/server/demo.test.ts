import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/server/app.js'

const servers: Server[] = []

async function serve() {
  const checkDatabase = vi.fn(async () => { throw new Error('Database must not be called') })
  const app = createApp(checkDatabase, {
    appOrigin: 'http://127.0.0.1:3001',
    cookieName: 'first-light-session',
    secure: false,
    ttlMs: 86_400_000,
  })
  const server = createServer(app)
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return { base: 'http://127.0.0.1:' + (server.address() as AddressInfo).port, checkDatabase }
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeIdleConnections()
  })))
})

describe('backend demonstration endpoint', () => {
  it('returns clearly dummy JSON without accessing MongoDB', async () => {
    const { base, checkDatabase } = await serve()
    const response = await fetch(base + '/api/demo')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      message: 'Hello from the First Light backend.',
      data: [{ id: 'demo-1', title: 'Example research source', status: 'demo' }],
    })
    expect(checkDatabase).not.toHaveBeenCalled()
  })

  it('supports HEAD and keeps the existing unsupported-method contract', async () => {
    const { base, checkDatabase } = await serve()
    const head = await fetch(base + '/api/demo', { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    const post = await fetch(base + '/api/demo', { method: 'POST' })
    expect(post.status).toBe(404)
    expect(await post.json()).toEqual({ error: 'Not found' })
    expect(checkDatabase).not.toHaveBeenCalled()
  })
})
