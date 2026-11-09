export type ImplementationStatus = 'planned' | 'building' | 'validated'

export interface ResearchSource {
  id: string
  title: string
  url: string
  notes: string
  createdAt: string
}

export interface ImplementationDecision {
  id: string
  sourceId: string
  finding: string
  implementation: string
  status: ImplementationStatus
  createdAt: string
}

export interface Workspace {
  version: 1
  sources: ResearchSource[]
  decisions: ImplementationDecision[]
}

export interface SourceInput { title: string; url: string; notes: string }
export interface DecisionInput { sourceId: string; finding: string; implementation: string }

export const STORAGE_KEY = 'first-light.workspace.v1'
export const emptyWorkspace = (): Workspace => ({ version: 1, sources: [], decisions: [] })

function required(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname && !url.username && !url.password
  } catch {
    return false
  }
}

export function createSource(input: SourceInput): ResearchSource {
  const title = required(input.title, 'Source title')
  const url = required(input.url, 'Source URL')
  if (!isHttpUrl(url)) throw new Error('Enter a full http:// or https:// URL without embedded credentials.')
  return { id: crypto.randomUUID(), title, url, notes: input.notes.trim(), createdAt: new Date().toISOString() }
}

export function createDecision(input: DecisionInput, workspace: Workspace): ImplementationDecision {
  if (!workspace.sources.some(source => source.id === input.sourceId)) {
    throw new Error('Choose an existing research source before adding a decision.')
  }
  return {
    id: crypto.randomUUID(),
    sourceId: input.sourceId,
    finding: required(input.finding, 'Research finding'),
    implementation: required(input.implementation, 'Proposed implementation'),
    status: 'planned',
    createdAt: new Date().toISOString(),
  }
}

export function isImplementationStatus(value: unknown): value is ImplementationStatus {
  return value === 'planned' || value === 'building' || value === 'validated'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim()
}

function isTimestamp(value: unknown): boolean {
  return nonEmptyString(value) && Number.isFinite(Date.parse(value))
}

/** Validate persisted data before it is rendered or used as a link target. */
export function parseWorkspace(raw: string): Workspace {
  const value: unknown = JSON.parse(raw)
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.sources) || !Array.isArray(value.decisions)) {
    throw new Error('Unsupported workspace format.')
  }
  const ids = new Set<string>()
  const sourceIds = new Set<string>()
  for (const source of value.sources) {
    if (!isRecord(source) || !nonEmptyString(source.id) || ids.has(source.id)
      || !nonEmptyString(source.title) || typeof source.url !== 'string' || !isHttpUrl(source.url)
      || typeof source.notes !== 'string' || !isTimestamp(source.createdAt)) {
      throw new Error('Invalid saved research source.')
    }
    ids.add(source.id)
    sourceIds.add(source.id)
  }
  for (const decision of value.decisions) {
    if (!isRecord(decision) || !nonEmptyString(decision.id) || ids.has(decision.id)
      || typeof decision.sourceId !== 'string' || !sourceIds.has(decision.sourceId)
      || !nonEmptyString(decision.finding) || !nonEmptyString(decision.implementation)
      || !isImplementationStatus(decision.status) || !isTimestamp(decision.createdAt)) {
      throw new Error('Invalid saved implementation decision.')
    }
    ids.add(decision.id)
  }
  return value as unknown as Workspace
}
