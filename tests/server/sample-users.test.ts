import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  connectDatabase: vi.fn(),
  getClient: vi.fn(),
  db: vi.fn(),
  collection: vi.fn(),
  find: vi.fn(),
  toArray: vi.fn(),
}))

vi.mock('../../src/server/lib/db.js', () => ({ connectDatabase: mocks.connectDatabase }))

import { readSampleUsers } from '../../src/server/lib/sample-users.js'

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  mocks.connectDatabase.mockResolvedValue({ getClient: mocks.getClient })
  mocks.getClient.mockReturnValue({ db: mocks.db })
  mocks.db.mockReturnValue({ collection: mocks.collection })
  mocks.collection.mockReturnValue({ find: mocks.find })
  mocks.find.mockReturnValue({ toArray: mocks.toArray })
})

describe('read-only sample MongoDB users', () => {
  it('uses only the fixed sample namespace, minimal projection and bounded query', async () => {
    mocks.toArray.mockResolvedValue([
      { _id: 'sample-a', name: 'Sample Alice', email: 'private@example.invalid', password: 'not-for-clients', extra: true },
      { name: 'Sample Bob' },
      { name: 'Sample Carol' },
    ])

    expect(await readSampleUsers()).toEqual([
      { name: 'Sample Alice' }, { name: 'Sample Bob' }, { name: 'Sample Carol' },
    ])
    expect(mocks.connectDatabase).toHaveBeenCalledExactlyOnceWith()
    expect(mocks.getClient).toHaveBeenCalledExactlyOnceWith()
    expect(mocks.db).toHaveBeenCalledExactlyOnceWith('sample_mflix')
    expect(mocks.collection).toHaveBeenCalledExactlyOnceWith('users')
    expect(mocks.find).toHaveBeenCalledExactlyOnceWith({}, {
      projection: { _id: 0, name: 1 }, sort: { _id: 1 }, limit: 3, maxTimeMS: 3_000,
    })
    expect(mocks.toArray).toHaveBeenCalledExactlyOnceWith()
  })

  it('returns no invented fallback data when the actual collection is empty', async () => {
    mocks.toArray.mockResolvedValue([])
    expect(await readSampleUsers()).toEqual([])
  })

  it('skips missing, non-string and blank names without exposing other fields', async () => {
    mocks.toArray.mockResolvedValue([{ name: null }, { name: 42 }, { email: 'hidden@example.invalid' }])
    expect(await readSampleUsers()).toEqual([])
    mocks.toArray.mockResolvedValue([{ name: '' }, { name: '  ' }, { name: 'Real name', password: 'hidden' }])
    expect(await readSampleUsers()).toEqual([{ name: 'Real name' }])
  })

  it('propagates connection failures rather than returning fake data', async () => {
    const error = new Error('Connection unavailable')
    mocks.connectDatabase.mockRejectedValue(error)
    await expect(readSampleUsers()).rejects.toBe(error)
    expect(mocks.getClient).not.toHaveBeenCalled()
    expect(mocks.find).not.toHaveBeenCalled()
  })

  it('propagates query failures rather than returning fake data', async () => {
    const error = new Error('Sample query unavailable')
    mocks.toArray.mockRejectedValue(error)
    await expect(readSampleUsers()).rejects.toBe(error)
  })
})
