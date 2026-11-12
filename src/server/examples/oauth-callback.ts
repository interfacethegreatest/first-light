import type { IncomingMessage, ServerResponse } from 'node:http'
import { findOrCreateOAuthUser } from '../auth/oauth-user.js'
import { establishVerifiedSession } from '../auth/session-http.js'

/**
 * PROVIDER INTEGRATION STUB: no OAuth/OIDC start or callback route is mounted.
 * A future provider library must verify identity before invoking these helpers.
 * These examples are server-only persistence/session completion, not a login API.
 */
interface VerifiedClaims {
  sub: string
  email?: string | null
  name?: string | null
  picture?: string | null
}

/**
 * Call from a real OAuth/OIDC library AFTER its server-side code exchange and validation:
 * state/PKCE, nonce where applicable, token signature, issuer, audience and expiry.
 * `configuredProvider` is your server's provider registration key (one trusted issuer per key),
 * e.g. "google". `claims` must be that library's verified result, never request.body claims.
 * This is a persistence example, not a token verifier, session issuer or public HTTP route.
 */
export async function onVerifiedOAuthCallback(configuredProvider: string, claims: VerifiedClaims) {
  return findOrCreateOAuthUser({
    provider: configuredProvider,
    providerAccountId: claims.sub,
    email: claims.email,
    name: claims.name,
    image: claims.picture,
  })
}

/**
 * Use in that same verified server-side provider callback to issue First Light's cookie.
 * The caller can then redirect to the app. This function is not mounted as a public
 * endpoint and must never receive unverified request.body claims or a client user ID.
 */
export async function onVerifiedOAuthSessionCallback(
  request: IncomingMessage,
  response: ServerResponse,
  configuredProvider: string,
  claims: VerifiedClaims,
) {
  if (response.headersSent) throw new Error('Complete sign-in before sending a response.')
  const user = await onVerifiedOAuthCallback(configuredProvider, claims)
  await establishVerifiedSession(request, response, user._id)
  return user
}
