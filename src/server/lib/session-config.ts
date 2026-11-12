export const MAX_SESSION_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000

export interface SessionConfig {
  appOrigin: string
  cookieName: string
  secure: boolean
  ttlMs: number
}

export function readSessionLifetimeMs(): number {
  const value = process.env.SESSION_TTL_DAYS?.trim() ?? '30'
  const days = Number(value)
  if (!/^\d+$/.test(value) || !Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error('SESSION_TTL_DAYS must be an integer between 1 and 365.')
  }
  return days * 24 * 60 * 60 * 1000
}

export function readSessionConfig(): SessionConfig {
  if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) {
    throw new Error('APP_ORIGIN is required in production.')
  }
  let origin: URL
  try { origin = new URL(process.env.APP_ORIGIN?.trim() ?? 'http://127.0.0.1:3001') }
  catch { throw new Error('APP_ORIGIN must be a valid HTTP(S) origin.') }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password
    || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('APP_ORIGIN must contain only an HTTP(S) scheme, host and optional port.')
  }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)
  if (origin.protocol !== 'https:' && (process.env.NODE_ENV === 'production' || !loopback)) {
    throw new Error('APP_ORIGIN must use HTTPS outside loopback development.')
  }
  const secure = origin.protocol === 'https:'
  return {
    appOrigin: origin.origin,
    cookieName: secure ? '__Host-first-light-session' : 'first-light-session',
    secure,
    ttlMs: readSessionLifetimeMs(),
  }
}
