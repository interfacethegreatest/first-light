import { describe, expect, it } from 'vitest'
import {
  createDecision,
  createSource,
  emptyWorkspace,
  parseWorkspace,
  type SourceInput,
  type Workspace,
} from '../src/workspace'

const sourceInput: SourceInput = {
  title: 'Example source for testing',
  url: 'https://example.org/research',
  notes: 'A test fixture, not a research claim.',
}

function linkedWorkspace(): Workspace {
  const workspace = emptyWorkspace()
  const source = createSource(sourceInput)
  workspace.sources.push(source)
  workspace.decisions.push(createDecision({
    sourceId: source.id,
    finding: 'A finding recorded during a test.',
    implementation: 'Build a prototype to evaluate the finding.',
  }, workspace))
  return workspace
}

describe('research records and evidence links', () => {
  it('starts without research claims and round-trips a linked source and decision', () => {
    expect(emptyWorkspace()).toEqual({ version: 1, sources: [], decisions: [] })
    const workspace = linkedWorkspace()

    expect(workspace.decisions[0].sourceId).toBe(workspace.sources[0].id)
    expect(workspace.decisions[0].status).toBe('planned')
    expect(parseWorkspace(JSON.stringify(workspace))).toEqual(workspace)
  })

  it('trims entered fields while preserving optional empty source notes', () => {
    const source = createSource({ title: '  Source  ', url: ' https://example.org/paper ', notes: '   ' })
    const workspace: Workspace = { version: 1, sources: [source], decisions: [] }
    const decision = createDecision({
      sourceId: source.id, finding: '  Observed result  ', implementation: '  Prototype behavior  ',
    }, workspace)

    expect(source).toMatchObject({ title: 'Source', url: 'https://example.org/paper', notes: '' })
    expect(decision).toMatchObject({ finding: 'Observed result', implementation: 'Prototype behavior' })
  })

  it.each([
    ['blank title', { ...sourceInput, title: ' \n ' }],
    ['blank URL', { ...sourceInput, url: ' ' }],
    ['relative URL', { ...sourceInput, url: '/paper' }],
    ['JavaScript URL', { ...sourceInput, url: 'javascript:alert(1)' }],
    ['data URL', { ...sourceInput, url: 'data:text/html,example' }],
    ['FTP URL', { ...sourceInput, url: 'ftp://example.org/paper' }],
    ['credential-bearing URL', { ...sourceInput, url: 'https://user:secret@example.org/paper' }],
  ])('rejects a source with %s', (_description, input) => {
    expect(() => createSource(input)).toThrow(Error)
  })

  it('accepts HTTP and HTTPS sources without requiring a particular publisher', () => {
    expect(createSource({ ...sourceInput, url: 'http://example.org/paper' }).url).toBe('http://example.org/paper')
    expect(createSource(sourceInput).url).toBe(sourceInput.url)
  })

  it('requires an existing source and nonblank finding and implementation', () => {
    const workspace = linkedWorkspace()
    const input = { sourceId: workspace.sources[0].id, finding: 'Finding', implementation: 'Prototype' }

    expect(() => createDecision({ ...input, sourceId: 'missing-source' }, workspace)).toThrow(Error)
    expect(() => createDecision({ ...input, finding: '  ' }, workspace)).toThrow(Error)
    expect(() => createDecision({ ...input, implementation: '\n' }, workspace)).toThrow(Error)
  })
})

describe('persisted record validation', () => {
  it.each(['{incomplete', 'null', '[]', '{}', '{"version":2,"sources":[],"decisions":[]}']) (
    'rejects malformed or unsupported storage: %s', raw => {
      expect(() => parseWorkspace(raw)).toThrow(Error)
    },
  )

  it('rejects unsafe links even when they come from saved data', () => {
    const workspace = linkedWorkspace()
    workspace.sources[0].url = 'javascript:alert(1)'
    expect(() => parseWorkspace(JSON.stringify(workspace))).toThrow(Error)
  })

  it('rejects a saved decision whose source does not exist', () => {
    const workspace = linkedWorkspace()
    workspace.decisions[0].sourceId = 'deleted-source'
    expect(() => parseWorkspace(JSON.stringify(workspace))).toThrow(Error)
  })

  it('rejects duplicate IDs across records', () => {
    const workspace = linkedWorkspace()
    workspace.decisions[0].id = workspace.sources[0].id
    expect(() => parseWorkspace(JSON.stringify(workspace))).toThrow(Error)

    workspace.decisions = []
    workspace.sources.push({ ...workspace.sources[0] })
    expect(() => parseWorkspace(JSON.stringify(workspace))).toThrow(Error)
  })

  it('rejects unrecognized statuses and invalid timestamps', () => {
    const workspace = linkedWorkspace()
    const invalidStatus = {
      ...workspace,
      decisions: [{ ...workspace.decisions[0], status: 'scientifically-proven' }],
    }
    expect(() => parseWorkspace(JSON.stringify(invalidStatus))).toThrow(Error)

    workspace.sources[0].createdAt = 'not a date'
    expect(() => parseWorkspace(JSON.stringify(workspace))).toThrow(Error)
  })
})
