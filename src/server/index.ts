import { createServer, type Server } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createApp } from './app.js'
import { readServerConfig, type ServerConfig } from './lib/config.js'
import { closeDatabase } from './lib/db.js'

export interface RunningServer {
  server: Server
  stop: () => Promise<void>
}

/** Local Node development owns shutdown; Vercel invokes the root api/*.ts entries directly. */
export async function startServer(overrides: Partial<ServerConfig> = {}): Promise<RunningServer> {
  const config = { ...readServerConfig(), ...overrides }
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535
    || !config.host || /\s/.test(config.host)) throw new Error('Invalid server listening configuration.')
  const server = createServer(createApp())
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.keepAliveTimeout = 5_000

  try {
    await new Promise<void>((accept, reject) => {
      const failed = (error: Error) => { server.off('listening', listening); reject(error) }
      const listening = () => { server.off('error', failed); accept() }
      server.once('error', failed)
      server.once('listening', listening)
      server.listen(config.port, config.host)
    })
  } catch (error) {
    await closeDatabase()
    throw new Error('Unable to start the API server.', { cause: error })
  }

  let stopping: Promise<void> | undefined
  const stop = (): Promise<void> => {
    if (stopping) return stopping
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
    stopping = (async () => {
      try {
        await new Promise<void>((accept, reject) => {
          const timer = setTimeout(() => {
            server.closeAllConnections()
            reject(new Error('HTTP shutdown timed out.'))
          }, 10_000)
          timer.unref()
          server.close(error => {
            clearTimeout(timer)
            if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') reject(error)
            else accept()
          })
          server.closeIdleConnections()
        })
      } finally {
        server.off('error', onServerError)
        await closeDatabase()
      }
    })()
    return stopping
  }
  function onSignal() {
    void stop().catch(() => {
      console.error('The API server could not shut down cleanly.')
      process.exitCode = 1
    })
  }
  function onServerError() {
    console.error('The API server encountered a server error.')
    process.exitCode = 1
    onSignal()
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  server.on('error', onServerError)
  return { server, stop }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void startServer().then(({ server }) => {
    const address = server.address()
    console.log(`First Light API listening on port ${typeof address === 'object' && address ? address.port : 'configured'}.`)
  }).catch(() => {
    // Driver errors can contain topology/credential details. Keep them off the console.
    console.error('Unable to start First Light API. Check the server environment configuration.')
    process.exitCode = 1
  })
}
