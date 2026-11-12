import { parseWorkspace, type Workspace } from '../workspace'

export interface SessionUser { id: string; email?: string; name?: string; image?: string }
export type BrowserSession = { authenticated: false; user: null }
  | { authenticated: true; user: SessionUser; expiresAt: string }
export interface ResearchSnapshot { workspace: Workspace; revision: number }

export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); this.name = 'ApiError' }
}

/** Cookies stay HttpOnly. No credential or user ID is stored in browser storage. */
async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (options.signal?.aborted) abort()
  else options.signal?.addEventListener('abort', abort, { once: true })
  let timedOut = false
  // A lost network connection must not leave the native UI checking/saving forever.
  // Manual signal composition also supports the application's older Safari target.
  const timer = setTimeout(() => { timedOut = true; abort() }, 20_000)
  try {
    const response = await fetch(path, {
      ...options, signal: controller.signal, credentials: 'same-origin', cache: 'no-store',
      headers: { Accept: 'application/json', ...options.headers },
    })
    if (response.status === 204) return undefined
    let body: unknown
    try { body = await response.json() }
    catch { throw new ApiError(response.status || 503, 'The account service did not return JSON. Your browser data is unchanged.') }
    if (!response.ok) {
      const message = isRecord(body) && typeof body.error === 'string' ? body.error : 'The account request failed.'
      throw new ApiError(response.status, message)
    }
    return body
  } catch (error) {
    if (timedOut) throw new ApiError(503, 'The account request timed out. Refresh before retrying; a save may already have reached the server.')
    throw error
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', abort)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export async function getBrowserSession(signal?: AbortSignal): Promise<BrowserSession> {
  const value = await request('/api/auth/session', { signal })
  if (isRecord(value) && value.authenticated === false && value.user === null) return { authenticated: false, user: null }
  if (!isRecord(value) || value.authenticated !== true || !isRecord(value.user)
    || typeof value.user.id !== 'string' || !value.user.id || typeof value.expiresAt !== 'string'
    || !Number.isFinite(Date.parse(value.expiresAt))) throw new ApiError(502, 'Invalid session response.')
  const user: SessionUser = { id: value.user.id }
  for (const key of ['name', 'email', 'image'] as const) {
    if (typeof value.user[key] === 'string') user[key] = value.user[key]
  }
  return { authenticated: true, user, expiresAt: value.expiresAt }
}

function snapshot(value: unknown): ResearchSnapshot {
  if (!isRecord(value) || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0) {
    throw new ApiError(502, 'Invalid research response.')
  }
  return { revision: value.revision as number, workspace: parseWorkspace(JSON.stringify(value.workspace)) }
}

export async function getResearch(userId: string, signal?: AbortSignal): Promise<ResearchSnapshot> {
  return snapshot(await request('/api/research', { signal, headers: { 'X-First-Light-Account': userId } }))
}

/** The account header is an identity precondition, never a source of ownership. */
export async function writeResearch(
  userId: string, workspace: Workspace, expectedRevision: number, signal?: AbortSignal, importing = false,
): Promise<ResearchSnapshot> {
  return snapshot(await request(importing ? '/api/research/import' : '/api/research', {
    method: importing ? 'POST' : 'PUT', signal,
    headers: { 'Content-Type': 'application/json', 'X-First-Light-Account': userId },
    body: JSON.stringify({ workspace, expectedRevision }),
  }))
}

export async function endBrowserSession(all: boolean, signal?: AbortSignal): Promise<void> {
  await request(all ? '/api/auth/logout-all' : '/api/auth/logout', { method: 'POST', signal })
}
