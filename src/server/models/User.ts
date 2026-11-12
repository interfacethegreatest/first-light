import { Schema, type Connection, type HydratedDocument, type Model } from 'mongoose'
import { connectDatabase } from '../lib/db.js'

export interface OAuthIdentity {
  /** Server-controlled provider registration key: use a distinct key for each trusted issuer. */
  provider: string
  /** Verified OAuth account ID / OIDC sub. Opaque and case-sensitive. */
  providerAccountId: string
}

export interface UserRecord {
  email?: string
  name?: string
  image?: string
  identities: OAuthIdentity[]
  createdAt: Date
  updatedAt: Date
}

export type UserDocument = HydratedDocument<UserRecord>

const identitySchema = new Schema<OAuthIdentity>({
  provider: { type: String, required: true, match: /^[a-z0-9][a-z0-9._-]{0,99}$/ },
  providerAccountId: {
    type: String,
    required: true,
    maxlength: 1024,
    validate: (value: string) => value.trim().length > 0,
  },
}, { _id: false })

const userSchema = new Schema<UserRecord>({
  // Profile metadata, not an identity key. Matching email never links two accounts.
  email: { type: String, trim: true, lowercase: true, maxlength: 320 },
  name: { type: String, trim: true, maxlength: 200 },
  image: { type: String, trim: true, maxlength: 2048 },
  identities: {
    type: [identitySchema],
    required: true,
    default: undefined,
    validate: {
      validator: (identities: OAuthIdentity[]) => identities.length > 0
        && new Set(identities.map(identity => JSON.stringify([identity.provider, identity.providerAccountId]))).size === identities.length,
      message: 'A user requires at least one distinct OAuth identity.',
    },
  },
}, { timestamps: true, autoCreate: false, autoIndex: false, versionKey: false, strict: 'throw' })

userSchema.index(
  { 'identities.provider': 1, 'identities.providerAccountId': 1 },
  { unique: true, name: 'unique_oauth_identity' },
)

export function getUserModel(connection: Connection): Model<UserRecord> {
  return (connection.models.FirstLightUser as Model<UserRecord> | undefined)
    ?? connection.model<UserRecord>('FirstLightUser', userSchema, 'users')
}

const indexReadiness = new WeakMap<Model<UserRecord>, Promise<void>>()

/** All identity writes wait for the unique index, including the first request to a new database. */
export async function getReadyUserModel(): Promise<Model<UserRecord>> {
  const model = getUserModel(await connectDatabase())
  let ready = indexReadiness.get(model)
  if (!ready) {
    ready = model.createIndexes().then(() => undefined).catch((error: unknown) => {
      indexReadiness.delete(model)
      throw error
    })
    indexReadiness.set(model, ready)
  }
  await ready
  return model
}
