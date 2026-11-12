import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

const mocks = vi.hoisted(() => ({ createConnection: vi.fn() }))
vi.mock('mongoose', () => ({ default: { createConnection: mocks.createConnection } }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

interface FakeConnection {
  readyState: number
  destroy: Mock<() => Promise<void>>
  asPromise: Mock<() => Promise<FakeConnection>>
  db: { command: Mock<(command: { ping: number }) => Promise<{ ok: number }>> }
}

function fakeConnection(): FakeConnection {
  const value: FakeConnection = {
    readyState: 1,
    destroy: vi.fn(async () => { value.readyState = 0 }),
    asPromise: vi.fn(async () => value),
    db: { command: vi.fn(async () => ({ ok: 1 })) },
  }
  return value
}

describe('cached MongoDB connection ownership', () => {
  beforeEach(() => {
    vi.resetModules()
    Reflect.deleteProperty(globalThis, '__firstLightMongo')
    mocks.createConnection.mockReset()
    vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:1/first_light_backend_test')
  })
  afterEach(async () => {
    const db = await import('../../src/server/lib/db.js')
    await db.closeDatabase()
    Reflect.deleteProperty(globalThis, '__firstLightMongo')
    vi.unstubAllEnvs()
  })

  it('does not read credentials or connect at import time', async () => {
    vi.stubEnv('MONGODB_URI', undefined)
    const db = await import('../../src/server/lib/db.js')
    expect(mocks.createConnection).not.toHaveBeenCalled()
    expect(() => db.connectDatabase()).toThrow('Set MONGODB_URI')
    expect(mocks.createConnection).not.toHaveBeenCalled()
  })

  it('connects lazily, shares one opening attempt and survives module reloads', async () => {
    const opening = deferred<ReturnType<typeof fakeConnection>>()
    const connection = fakeConnection()
    connection.asPromise.mockImplementation(() => opening.promise)
    mocks.createConnection.mockReturnValue(connection)
    const db = await import('../../src/server/lib/db.js')
    expect(mocks.createConnection).not.toHaveBeenCalled()
    const requests = Array.from({ length: 20 }, () => db.connectDatabase())
    expect(new Set(requests).size).toBe(1)
    opening.resolve(connection)
    expect((await Promise.all(requests)).every(value => Object.is(value, connection))).toBe(true)
    vi.resetModules()
    const reloaded = await import('../../src/server/lib/db.js')
    expect(await reloaded.connectDatabase()).toBe(connection)
    expect(mocks.createConnection).toHaveBeenCalledTimes(1)
    await reloaded.pingDatabase()
    expect(connection.db.command).toHaveBeenCalledWith({ ping: 1 })
  })

  it('cleans a failed pool and permits the next attempt to succeed', async () => {
    const failed = fakeConnection()
    failed.asPromise.mockRejectedValue(new Error('fake confidential driver details'))
    const healthy = fakeConnection()
    mocks.createConnection.mockReturnValueOnce(failed).mockReturnValueOnce(healthy)
    const db = await import('../../src/server/lib/db.js')
    await expect(db.connectDatabase()).rejects.toThrow('Unable to connect to MongoDB.')
    expect(failed.destroy).toHaveBeenCalledTimes(1)
    expect(await db.connectDatabase()).toBe(healthy)
    expect(mocks.createConnection).toHaveBeenCalledTimes(2)
  })

  it('destroys stale pools before replacing them and rejects URI changes until cleanup', async () => {
    const stale = fakeConnection()
    const healthy = fakeConnection()
    mocks.createConnection.mockReturnValueOnce(stale).mockReturnValueOnce(healthy)
    const db = await import('../../src/server/lib/db.js')
    await db.connectDatabase()
    stale.readyState = 0
    expect(await db.connectDatabase()).toBe(healthy)
    expect(stale.destroy.mock.invocationCallOrder[0]).toBeLessThan(mocks.createConnection.mock.invocationCallOrder[1])
    vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:2/first_light_backend_test')
    await expect(db.connectDatabase()).rejects.toThrow('MONGODB_URI changed')
    expect(mocks.createConnection).toHaveBeenCalledTimes(2)
    await db.closeDatabase()
    expect(healthy.destroy).toHaveBeenCalledTimes(1)
    mocks.createConnection.mockReturnValue(fakeConnection())
    await db.connectDatabase()
    expect(mocks.createConnection).toHaveBeenCalledTimes(3)
  })

  it('shares shutdown and queues new connections behind an in-flight close', async () => {
    const closing = deferred<void>()
    const first = fakeConnection()
    first.destroy.mockImplementation(async () => { await closing.promise; first.readyState = 0 })
    const second = fakeConnection()
    mocks.createConnection.mockReturnValueOnce(first).mockReturnValueOnce(second)
    const db = await import('../../src/server/lib/db.js')
    await db.connectDatabase()
    const stop = db.closeDatabase()
    expect(db.closeDatabase()).toBe(stop)
    const next = db.connectDatabase()
    expect(mocks.createConnection).toHaveBeenCalledTimes(1)
    closing.resolve()
    await stop
    expect(await next).toBe(second)
    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(mocks.createConnection).toHaveBeenCalledTimes(2)
  })

  it('waits for an opening attempt to settle before shutdown and reopening', async () => {
    const opening = deferred<FakeConnection>()
    const first = fakeConnection()
    first.asPromise.mockImplementation(() => opening.promise)
    const second = fakeConnection()
    mocks.createConnection.mockReturnValueOnce(first).mockReturnValueOnce(second)
    const db = await import('../../src/server/lib/db.js')
    const start = db.connectDatabase()
    const stop = db.closeDatabase()
    const next = db.connectDatabase()
    expect(first.destroy).not.toHaveBeenCalled()
    expect(mocks.createConnection).toHaveBeenCalledTimes(1)
    opening.resolve(first)
    await start
    await stop
    expect(await next).toBe(second)
    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(mocks.createConnection).toHaveBeenCalledTimes(2)
  })
})
