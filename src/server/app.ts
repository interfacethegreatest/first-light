import healthHandler from '../../api/health.js'
import demoHandler from '../../api/demo.js'
import { createReadyHandler } from '../../api/ready.js'
import { createSessionHandler } from '../../api/auth/session.js'
import { createLogoutHandler } from '../../api/auth/logout.js'
import { createLogoutAllHandler } from '../../api/auth/logout-all.js'
import { createResearchHandler } from '../../api/research/index.js'
import { createImportResearchHandler } from '../../api/research/import.js'
import notFoundHandler from '../../api/not-found.js'
import { apiHandler, type ApiHandler } from './http/response.js'
import { pingDatabase } from './lib/db.js'
import { readSessionConfig, type SessionConfig } from './lib/session-config.js'

/**
 * Small local Node adapter for server:dev/start. Vercel invokes api/*.ts directly
 * and never imports this router or index.ts's listener/signal lifecycle.
 */
export function createApp(
  checkDatabase: () => Promise<void> = pingDatabase,
  sessionConfig: SessionConfig = readSessionConfig(),
): ApiHandler {
  const ready = createReadyHandler(checkDatabase)
  const routes = new Map<string, ApiHandler>([
    ['/health', healthHandler],
    ['/api/health', healthHandler],
    ['/api/demo', demoHandler],
    ['/ready', ready],
    ['/api/ready', ready],
    ['/api/auth/session', createSessionHandler(sessionConfig)],
    ['/api/auth/logout', createLogoutHandler(sessionConfig)],
    ['/api/auth/logout-all', createLogoutAllHandler(sessionConfig)],
    ['/api/research', createResearchHandler(sessionConfig)],
    ['/api/research/import', createImportResearchHandler(sessionConfig)],
    ['/api/not-found', notFoundHandler],
  ])

  return apiHandler(null, async (request, response) => {
    // The fixed base is only for parsing a path; no request Host header is trusted.
    const pathname = new URL(request.url ?? '/', 'http://local.invalid').pathname
      .replace(/\/$/, '').toLowerCase()
    await (routes.get(pathname) ?? notFoundHandler)(request, response)
  })
}
