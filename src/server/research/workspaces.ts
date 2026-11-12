import { Types } from 'mongoose'
import { emptyWorkspace, type Workspace } from '../../workspace.js'
import { RequestError } from '../http/json.js'
import { getReadyResearchWorkspaceModel } from '../models/ResearchWorkspace.js'
import { validateResearchWorkspace } from './validation.js'

export interface OwnedResearch { workspace: Workspace; revision: number }
const conflict = () => new RequestError(409, 'Research changed or an imported ID conflicts. Reload account research before trying again.')

/** The ID comes exclusively from requireSession, never a query or body field. */
function ownerId(authenticatedUserId: string): Types.ObjectId {
  if (!/^[a-f0-9]{24}$/i.test(authenticatedUserId)) throw new Error('Invalid authenticated owner.')
  return new Types.ObjectId(authenticatedUserId)
}
export async function readResearch(authenticatedUserId: string): Promise<OwnedResearch> {
  const model = await getReadyResearchWorkspaceModel()
  const record = await model.findOne({ ownerId: ownerId(authenticatedUserId) }).select({ workspace: 1, revision: 1, _id: 0 }).lean().exec()
  return record ? { workspace: validateResearchWorkspace(record.workspace), revision: record.revision } : { workspace: emptyWorkspace(), revision: 0 }
}

/** A single document CAS atomically protects sources and their dependent decisions. */
export async function replaceResearch(authenticatedUserId: string, workspace: Workspace, expectedRevision: number): Promise<OwnedResearch> {
  const canonical = validateResearchWorkspace(workspace)
  const model = await getReadyResearchWorkspaceModel()
  const owner = ownerId(authenticatedUserId)
  if (expectedRevision === 0) {
    try {
      await model.create({ ownerId: owner, workspace: canonical, revision: 1 })
      return { workspace: canonical, revision: 1 }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw conflict()
      throw error
    }
  }
  const updated = await model.findOneAndUpdate(
    { ownerId: owner, revision: expectedRevision },
    { $set: { workspace: canonical }, $inc: { revision: 1 } },
    { returnDocument: 'after', runValidators: true },
  ).select({ workspace: 1, revision: 1, _id: 0 }).lean().exec()
  if (!updated) throw conflict()
  return { workspace: validateResearchWorkspace(updated.workspace), revision: updated.revision }
}

export async function importResearch(authenticatedUserId: string, incoming: Workspace, expectedRevision: number) {
  const canonical = validateResearchWorkspace(incoming)
  const current = await readResearch(authenticatedUserId)
  if (current.revision !== expectedRevision) throw conflict()
  const existing = new Map<string, string>([
    ...current.workspace.sources.map(source => [source.id, JSON.stringify(source)] as const),
    ...current.workspace.decisions.map(decision => [decision.id, JSON.stringify(decision)] as const),
  ])
  const append = <T extends { id: string }>(records: T[]): T[] => records.filter(record => {
    const previous = existing.get(record.id)
    if (previous === undefined) return true
    if (previous !== JSON.stringify(record)) throw conflict()
    return false
  })
  const sources = append(canonical.sources)
  const decisions = append(canonical.decisions)
  if (sources.length === 0 && decisions.length === 0) return { ...current, imported: { sources: 0, decisions: 0 } }
  const result = await replaceResearch(authenticatedUserId, {
    version: 1, sources: [...current.workspace.sources, ...sources], decisions: [...current.workspace.decisions, ...decisions],
  }, expectedRevision)
  return { ...result, imported: { sources: sources.length, decisions: decisions.length } }
}
