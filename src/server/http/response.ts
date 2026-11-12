import type { IncomingMessage, ServerResponse } from 'node:http'

export type ApiHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void | Promise<void>

export function noStore(response: ServerResponse, varyCookie = false): void {
  response.setHeader('Cache-Control', 'no-store')
  if (!varyCookie) return
  const existing = response.getHeader('Vary')
  const values = (Array.isArray(existing) ? existing.join(', ') : String(existing ?? ''))
    .split(',').map(value => value.trim()).filter(Boolean)
  if (!values.some(value => value === '*' || value.toLowerCase() === 'cookie')) values.push('Cookie')
  response.setHeader('Vary', values.join(', '))
}

export function sendJson(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  const json = JSON.stringify(body) ?? 'null'
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Content-Length', Buffer.byteLength(json))
  response.end(request.method === 'HEAD' ? undefined : json)
}

export function sendEmpty(response: ServerResponse, status: number): void {
  response.statusCode = status
  response.removeHeader('Content-Type')
  response.removeHeader('Content-Length')
  response.end()
}

export function notFound(request: IncomingMessage, response: ServerResponse): void {
  sendJson(request, response, 404, { error: 'Not found' })
}

/** Keep unrelated provider/state cookies when issuing or clearing our own cookie. */
export function appendSetCookie(response: ServerResponse, value: string): void {
  const existing = response.getHeader('Set-Cookie')
  const cookies = existing === undefined ? [] : Array.isArray(existing) ? existing : [String(existing)]
  response.setHeader('Set-Cookie', [...cookies, value])
}

/**
 * A native Node boundary shared by local HTTP and Vercel function exports.
 * Unsupported methods retain the current API's JSON 404 contract. GET also
 * handles HEAD, and explicit OPTIONS responses mirror the old router's Allow list.
 */
export function apiHandler(
  method: 'GET' | 'POST' | null,
  handler: ApiHandler,
  options: { varyCookie?: boolean } = {},
): ApiHandler {
  return async (request, response) => {
    try {
      noStore(response, options.varyCookie)
      if (method) {
        const allowed = method === 'GET' ? ['GET', 'HEAD'] : ['POST']
        if (request.method === 'OPTIONS') {
          const body = allowed.join(', ')
          response.statusCode = 200
          response.setHeader('Allow', body)
          response.setHeader('Content-Type', 'text/plain')
          response.setHeader('Content-Length', Buffer.byteLength(body))
          response.setHeader('X-Content-Type-Options', 'nosniff')
          response.end(body)
          return
        }
        if (!allowed.includes(request.method ?? '')) {
          notFound(request, response)
          return
        }
      }
      await handler(request, response)
    } catch {
      // Never expose driver errors, environment values, tokens or stack traces.
      if (response.headersSent) { response.destroy(); return }
      sendJson(request, response, 500, { error: 'Internal server error' })
    }
  }
}
