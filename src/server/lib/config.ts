export interface ServerConfig {
  host: string
  port: number
}

export function readMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new Error('Set MONGODB_URI to a MongoDB connection string.')
  }
  return uri
}

export function readServerConfig(): ServerConfig {
  readMongoUri()
  const value = process.env.PORT ?? '3001'
  const port = Number(value)
  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }
  const host = process.env.HOST?.trim() ?? '127.0.0.1'
  if (!host || /\s/.test(host)) throw new Error('HOST must be a valid listening host.')
  return { host, port }
}
