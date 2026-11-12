import { getReadyUserModel, type OAuthIdentity, type UserDocument, type UserRecord } from '../models/User.js'

/** Only pass claims from a provider token/callback already verified on the server. */
export interface VerifiedOAuthProfile extends OAuthIdentity {
  email?: string | null
  name?: string | null
  image?: string | null
}

function optionalText(value: unknown, field: string, maxLength: number): string | undefined {
  if (value == null) return undefined
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new TypeError(`Invalid OAuth ${field}.`)
  }
  return value.trim() || undefined
}

function identityFrom(profile: VerifiedOAuthProfile): OAuthIdentity {
  if (!profile || typeof profile !== 'object'
    || typeof profile.provider !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,99}$/.test(profile.provider)
    || typeof profile.providerAccountId !== 'string' || !profile.providerAccountId.trim()
    || profile.providerAccountId.length > 1024) {
    throw new TypeError('A registered provider and verified provider account ID are required.')
  }
  // In particular, never lowercase, parse as a number or trim an opaque subject.
  return { provider: profile.provider, providerAccountId: profile.providerAccountId }
}

function profileUpdates(profile: VerifiedOAuthProfile): Partial<Pick<UserRecord, 'email' | 'name' | 'image'>> {
  const updates: Partial<Pick<UserRecord, 'email' | 'name' | 'image'>> = {}
  const email = optionalText(profile.email, 'email', 320)?.toLowerCase()
  const name = optionalText(profile.name, 'name', 200)
  const image = optionalText(profile.image, 'image', 2048)
  if (email && !/^[^\s@]+@[^\s@]+$/.test(email)) throw new TypeError('Invalid OAuth email.')
  if (image) {
    let url: URL
    try { url = new URL(image) } catch { throw new TypeError('Invalid OAuth image URL.') }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new TypeError('Invalid OAuth image URL.')
  }
  if (email) updates.email = email
  if (name) updates.name = name
  if (image) updates.image = image
  return updates
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000
}

/**
 * Server-only persistence after OAuth/OIDC verification, never a public callback accepting JSON.
 * No email lookup or automatic linking occurs. Future linking must verify the second identity
 * and an authenticated current user before adding it to that user's identities array.
 */
export async function findOrCreateOAuthUser(profile: VerifiedOAuthProfile): Promise<UserDocument> {
  const identity = identityFrom(profile)
  const updates = profileUpdates(profile)
  const User = await getReadyUserModel()
  const filter = { identities: { $elemMatch: identity } }

  try {
    const user = await User.findOneAndUpdate(filter, {
      $set: updates,
      $setOnInsert: { identities: [identity] },
    }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }).exec()
    if (!user) throw new Error('OAuth user could not be saved.')
    return user
  } catch (error) {
    if (!isDuplicateKey(error)) throw error
    // A simultaneous first sign-in may win the insert; the unique index is authoritative.
    const user = await User.findOneAndUpdate(filter, { $set: updates }, {
      returnDocument: 'after', runValidators: true,
    }).exec()
    if (!user) throw new Error('OAuth user could not be found after concurrent sign-in.', { cause: error })
    return user
  }
}
