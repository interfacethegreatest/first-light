import { Schema, type Connection, type Model, type Types } from 'mongoose'
import type { Workspace } from '../../workspace.js'
import { connectDatabase } from '../lib/db.js'

export interface ResearchWorkspaceRecord {
  ownerId: Types.ObjectId
  workspace: Workspace
  revision: number
  createdAt: Date
  updatedAt: Date
}
const sourceSchema = new Schema({
  id: { type: String, required: true }, title: { type: String, required: true },
  url: { type: String, required: true }, notes: { type: String, default: '' },
  createdAt: { type: String, required: true },
}, { _id: false, strict: 'throw' })
const decisionSchema = new Schema({
  id: { type: String, required: true }, sourceId: { type: String, required: true },
  finding: { type: String, required: true }, implementation: { type: String, required: true },
  status: { type: String, enum: ['planned', 'building', 'validated'], required: true },
  createdAt: { type: String, required: true },
}, { _id: false, strict: 'throw' })
const workspaceSchema = new Schema({
  version: { type: Number, enum: [1], required: true },
  sources: { type: [sourceSchema], required: true }, decisions: { type: [decisionSchema], required: true },
}, { _id: false, strict: 'throw' })
const schema = new Schema<ResearchWorkspaceRecord>({
  ownerId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  workspace: { type: workspaceSchema, required: true },
  revision: { type: Number, required: true, min: 1 },
}, { timestamps: true, versionKey: false, strict: 'throw', autoCreate: false, autoIndex: false })
schema.index({ ownerId: 1 }, { unique: true, name: 'unique_research_owner' })

export function getResearchWorkspaceModel(connection: Connection): Model<ResearchWorkspaceRecord> {
  return (connection.models.FirstLightResearchWorkspace as Model<ResearchWorkspaceRecord> | undefined)
    ?? connection.model<ResearchWorkspaceRecord>('FirstLightResearchWorkspace', schema, 'research_workspaces')
}
const indexReadiness = new WeakMap<Model<ResearchWorkspaceRecord>, Promise<void>>()
export async function getReadyResearchWorkspaceModel(): Promise<Model<ResearchWorkspaceRecord>> {
  const model = getResearchWorkspaceModel(await connectDatabase())
  let ready = indexReadiness.get(model)
  if (!ready) {
    ready = model.createIndexes().then(() => undefined).catch((error: unknown) => { indexReadiness.delete(model); throw error })
    indexReadiness.set(model, ready)
  }
  await ready
  return model
}
