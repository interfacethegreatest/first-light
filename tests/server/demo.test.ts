import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDemoHandler } from '../../api/demo.js'

const servers: Server[] = []

async function serve(readUsers = vi.fn(async () => [{ name: 'Sample User' }] as { name: string }[])) {
  const server = createServer(createDemoHandler(readUsers))
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return { base: 'http://127.0.0.1:' + (server.address() as AddressInfo).port, readUsers }
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeIdleConnections()
  })))
})

describe('backend demonstration endpoint', () => {
  it('returns the database reader result without caching it', async () => {
    const { base, readUsers } = await serve()
    const response = await fetch(base + '/api/demo')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      message: 'Sample users read from MongoDB.', database: 'sample_mflix', collection: 'users',
      data: [{ name: 'Sample User' }],
    })
    expect(readUsers).toHaveBeenCalledTimes(1)
  })

  it('supports HEAD and keeps the existing unsupported-method contract', async () => {
    const { base, readUsers } = await serve()
    const head = await fetch(base + '/api/demo', { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    const post = await fetch(base + '/api/demo', { method: 'POST' })
    expect(post.status).toBe(404)
    expect(await post.json()).toEqual({ error: 'Not found' })
    expect(readUsers).toHaveBeenCalledTimes(1)
  })

  it('returns an empty real query result without inventing fixture data', async () => {
    const { base } = await serve(vi.fn(async () => []))
    expect(await (await fetch(base)).json()).toMatchObject({ data: [] })
  })

  it.each([
    [13, 'SAMPLE_DATABASE_ACCESS_DENIED'],
    [18, 'DATABASE_AUTHENTICATION_FAILED'],
    [undefined, 'SAMPLE_DATA_UNAVAILABLE'],
  ])('sanitizes database failures with code %s', async (code, expected) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const privateError = Object.assign(new Error('mongodb://fake:private@secret.invalid/private'), { code })
    const { base } = await serve(vi.fn(async () => { throw new Error('Wrapper', { cause: privateError }) }))
    const response = await fetch(base)
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.json()
    expect(body).toEqual({ error: 'Could not read sample users. Check MongoDB connectivity and read access to sample_mflix.users.', code: expected })
    expect(JSON.stringify(body)).not.toContain('secret.invalid')
    expect(log).toHaveBeenCalledWith('MongoDB sample-user lookup failed:', expected)
    log.mockRestore()
  })

  it.each([
    ['configuration', new Error('Set MONGODB_URI to a MongoDB connection string.'), 'DATABASE_CONFIGURATION_INVALID'],
    ['MongoDB URI parsing', Object.assign(new Error('mongodb://fake:private@secret.invalid/private'), { name: 'MongoParseError' }), 'DATABASE_URI_INVALID'],
    ['URL parsing', Object.assign(new Error('mongodb://fake:private@secret.invalid/private'), { code: 'ERR_INVALID_URL' }), 'DATABASE_URI_INVALID'],
  ])('safely categorizes %s failures through their cause chain', async (_description, cause, expected) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { base } = await serve(vi.fn(async () => {
      throw new Error('mongodb://fake:private@secret.invalid/private', { cause })
    }))
    const response = await fetch(base)
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = await response.json()
    expect(body).toEqual({ error: 'Could not read sample users. Check MongoDB connectivity and read access to sample_mflix.users.', code: expected })
    expect(JSON.stringify(body)).not.toContain('secret.invalid')
    expect(log.mock.calls).toEqual([['MongoDB sample-user lookup failed:', expected]])
    log.mockRestore()
  })
})
