import { parseWorkspace, type Workspace } from '../../workspace.js'
import { MAX_JSON_BYTES, RequestError } from '../http/json.js'

export const MAX_SOURCES = 500
export const MAX_DECISIONS = 1000

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function exactKeys(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!object(value) || Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))) {
    throw new RequestError(400, 'Unexpected or missing research fields.')
  }
}
function lengths(record: Record<string, unknown>, fields: Record<string, number>) {
  for (const [key, limit] of Object.entries(fields)) {
    if (typeof record[key] !== 'string' || record[key].length > limit) throw new RequestError(400, `Invalid research ${key}.`)
  }
}

/** Canonical allowlisted data: no ownership fields, query operators or arbitrary extras. */
export function validateResearchWorkspace(value: unknown): Workspace {
  exactKeys(value, ['version', 'sources', 'decisions'])
  if (!Array.isArray(value.sources) || !Array.isArray(value.decisions)
    || value.sources.length > MAX_SOURCES || value.decisions.length > MAX_DECISIONS) {
    throw new RequestError(400, 'Limit research to 500 sources and 1000 decisions.')
  }
  for (const source of value.sources) {
    exactKeys(source, ['id', 'title', 'url', 'notes', 'createdAt'])
    lengths(source, { id: 128, title: 500, url: 4096, notes: 20000, createdAt: 64 })
  }
  for (const decision of value.decisions) {
    exactKeys(decision, ['id', 'sourceId', 'finding', 'implementation', 'status', 'createdAt'])
    lengths(decision, { id: 128, sourceId: 128, finding: 20000, implementation: 20000, status: 20, createdAt: 64 })
  }
  let workspace: Workspace
  try { workspace = parseWorkspace(JSON.stringify(value)) }
  catch { throw new RequestError(400, 'Invalid research workspace, source URL, date or source reference.') }
  // Consistent order makes repeat imports equivalent even if JSON object key order differs.
  const canonical: Workspace = {
    version: 1,
    sources: workspace.sources.map(({ id, title, url, notes, createdAt }) => ({ id, title, url, notes, createdAt })),
    decisions: workspace.decisions.map(({ id, sourceId, finding, implementation, status, createdAt }) => ({ id, sourceId, finding, implementation, status, createdAt })),
  }
  if (Buffer.byteLength(JSON.stringify(canonical)) > MAX_JSON_BYTES - 1024) {
    throw new RequestError(413, 'Research workspace exceeds its storage limit.')
  }
  return canonical
}

export function validateResearchWrite(value: unknown): { workspace: Workspace; expectedRevision: number } {
  exactKeys(value, ['workspace', 'expectedRevision'])
  if (!Number.isSafeInteger(value.expectedRevision) || (value.expectedRevision as number) < 0 || (value.expectedRevision as number) >= Number.MAX_SAFE_INTEGER) {
    throw new RequestError(400, 'expectedRevision must be a nonnegative safe integer.')
  }
  return { workspace: validateResearchWorkspace(value.workspace), expectedRevision: value.expectedRevision as number }
}
