import { Schema, type Connection, type Model, type Types } from 'mongoose'
import { connectDatabase } from '../lib/db.js'

export interface SessionRecord {
  userId: Types.ObjectId
  tokenHash: string
  createdAt: Date
  expiresAt: Date
  revokedAt: Date | null
}

const sessionSchema = new Schema<SessionRecord>({
  userId: { type: Schema.Types.ObjectId, required: true },
  // The browser token is returned only when issued; it is never stored in MongoDB.
  tokenHash: { type: String, required: true, match: /^[a-f0-9]{64}$/, select: false },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  autoCreate: false,
  autoIndex: false,
  versionKey: false,
  strict: 'throw',
})

sessionSchema.index({ tokenHash: 1 }, { unique: true, name: 'unique_session_token_hash' })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expired_session_cleanup' })
sessionSchema.index({ userId: 1 }, { name: 'sessions_by_user' })

export function getSessionModel(connection: Connection): Model<SessionRecord> {
  return (connection.models.FirstLightSession as Model<SessionRecord> | undefined)
    ?? connection.model<SessionRecord>('FirstLightSession', sessionSchema, 'sessions')
}

const indexReadiness = new WeakMap<Model<SessionRecord>, Promise<void>>()

export async function getReadySessionModel(): Promise<Model<SessionRecord>> {
  const model = getSessionModel(await connectDatabase())
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
