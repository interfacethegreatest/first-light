import mongoose, { type Connection } from 'mongoose'
import { readMongoUri } from './config.js'

interface MongoCache {
  connection: Connection | null
  opening: Promise<Connection> | null
  closing: Promise<void> | null
  uri: string | null
}

// One pool and one in-flight attempt across dev reloads and warm serverless calls.
// Nothing connects, reads credentials or starts timers merely by importing this file.
const scope = globalThis as typeof globalThis & { __firstLightMongo?: MongoCache }
const cache = scope.__firstLightMongo ??= {
  connection: null, opening: null, closing: null, uri: null,
}

export function connectDatabase(): Promise<Connection> {
  if (cache.closing) return cache.closing.then(connectDatabase)

  const uri = readMongoUri()
  if (cache.uri && cache.uri !== uri) {
    return Promise.reject(new Error('MONGODB_URI changed; close the database connection or restart the server.'))
  }
  if (cache.opening) return cache.opening
  if (cache.connection?.readyState === 1) return Promise.resolve(cache.connection)

  cache.uri = uri
  const previous = cache.connection
  cache.opening = (async () => {
    try {
      // Destroy an old pool and remove its connection from Mongoose's registry before replacement.
      if (previous) {
        await previous.destroy()
        if (cache.connection === previous) cache.connection = null
      }

      const connection = mongoose.createConnection(uri, {
        maxPoolSize: 5,
        minPoolSize: 0,
        maxIdleTimeMS: 30_000,
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 5_000,
        socketTimeoutMS: 15_000,
        waitQueueTimeoutMS: 5_000,
        bufferCommands: false,
        autoCreate: false,
        autoIndex: false,
      })
      cache.connection = connection
      try {
        return await connection.asPromise()
      } catch (error) {
        try {
          await connection.destroy()
          if (cache.connection === connection) cache.connection = null
        } catch {
          // Retain the reference: a later retry must destroy it before opening another pool.
        }
        throw error
      }
    } catch (error) {
      if (!cache.connection) cache.uri = null
      throw new Error('Unable to connect to MongoDB.', { cause: error })
    }
  })().finally(() => { cache.opening = null })

  return cache.opening
}

export function closeDatabase(): Promise<void> {
  if (cache.closing) return cache.closing

  cache.closing = (async () => {
    try {
      // Let an in-flight attempt settle before destroying its owned connection.
      await cache.opening
    } catch {
      // Failed attempts have already performed their own cleanup.
    }
    if (cache.connection) {
      await cache.connection.destroy()
      cache.connection = null
    }
    cache.uri = null
  })().finally(() => { cache.closing = null })

  return cache.closing
}

/** A read-only round trip; does not create a collection or any user records. */
export async function pingDatabase(): Promise<void> {
  const connection = await connectDatabase()
  if (!connection.db) throw new Error('MongoDB is not ready.')
  await connection.db.command({ ping: 1 })
}
