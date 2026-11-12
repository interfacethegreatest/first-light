import { connectDatabase } from './db.js'

/** Read-only sample data probe; never reads First Light accounts or credentials. */
export async function readSampleUsers(): Promise<Array<{ name: string }>> {
  const connection = await connectDatabase()
  const users = await connection.getClient().db('sample_mflix')
    .collection<{ name?: unknown }>('users')
    .find({}, {
      projection: { _id: 0, name: 1 },
      sort: { _id: 1 },
      limit: 3,
      maxTimeMS: 3_000,
    })
    .toArray()

  return users.flatMap(({ name }) => typeof name === 'string' && name.trim().length > 0
    ? [{ name }]
    : [])
}
