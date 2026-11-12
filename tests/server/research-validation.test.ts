import { Readable } from 'node:stream'
import type { IncomingMessage } from 'node:http'
import { describe, expect, it } from 'vitest'
import { MAX_JSON_BYTES, readJson } from '../../src/server/http/json.js'
import { validateResearchWrite, validateResearchWorkspace } from '../../src/server/research/validation.js'

const source = { id: 'source-a', title: 'Study', url: 'https://example.org/paper', notes: '', createdAt: '2026-11-12T00:00:00.000Z' }
const workspace = () => ({ version: 1, sources: [{ ...source }], decisions: [] })
function request(chunks: unknown[], headers = { 'content-type': 'application/json' }, body?: unknown) {
  const stream = Readable.from(chunks) as IncomingMessage & { body?: unknown }
  stream.headers = headers
  if (body !== undefined) stream.body = body
  return stream
}

describe('bounded native and Vercel JSON bodies', () => {
  it('accepts streamed, pre-parsed, string and Buffer bodies identically', async () => {
    for (const body of [undefined, { workspace: workspace(), expectedRevision: 0 }, JSON.stringify({ workspace: workspace(), expectedRevision: 0 }), Buffer.from(JSON.stringify({ workspace: workspace(), expectedRevision: 0 }))]) {
      const req = request([JSON.stringify({ workspace: workspace(), expectedRevision: 0 })], undefined, body)
      expect(await readJson(req)).toEqual({ workspace: workspace(), expectedRevision: 0 })
      expect(req.listenerCount('data')).toBe(0)
      expect(req.listenerCount('end')).toBe(0)
      expect(req.listenerCount('aborted')).toBe(0)
    }
  })
  it('rejects unsupported media types, compressed input and malformed JSON', async () => {
    await expect(readJson(request(['{}'], { 'content-type': 'text/plain' }))).rejects.toMatchObject({ status: 415 })
    const compressed = request(['{}']); compressed.headers['content-encoding'] = 'gzip'
    await expect(readJson(compressed)).rejects.toMatchObject({ status: 415 })
    await expect(readJson(request(['{broken']))).rejects.toMatchObject({ status: 400 })
    await expect(readJson(request([], undefined, '{broken'))).rejects.toMatchObject({ status: 400 })
  })
  it('enforces byte limits on streamed and all serverless pre-parsed representations', async () => {
    const large = 'x'.repeat(MAX_JSON_BYTES + 1)
    for (const body of [undefined, large, Buffer.from(large), { text: large }]) {
      const req = request([large], undefined, body)
      await expect(readJson(req)).rejects.toMatchObject({ status: 413 })
      expect(req.listenerCount('data')).toBe(0)
      expect(req.listenerCount('end')).toBe(0)
      expect(req.listenerCount('aborted')).toBe(0)
    }
    const declared = request(['{}']); declared.headers['content-length'] = String(MAX_JSON_BYTES + 1)
    await expect(readJson(declared)).rejects.toMatchObject({ status: 413 })
  })
  it('cleans listeners when body reading is aborted', async () => {
    const stream = new Readable({ read() {} }) as IncomingMessage
    stream.headers = { 'content-type': 'application/json' }
    const pending = readJson(stream)
    stream.emit('aborted')
    await expect(pending).rejects.toMatchObject({ status: 400 })
    for (const name of ['data', 'end', 'aborted', 'error']) expect(stream.listenerCount(name)).toBe(0)
    stream.destroy()
  })
})

describe('strict canonical research validation', () => {
  it('allows only the versioned workspace and safe write envelope', () => {
    expect(validateResearchWrite({ workspace: workspace(), expectedRevision: 0 })).toEqual({ workspace: workspace(), expectedRevision: 0 })
    for (const extra of [{ ownerId: 'other' }, { userId: 'other' }, { $set: {} }]) {
      expect(() => validateResearchWrite({ workspace: workspace(), expectedRevision: 0, ...extra })).toThrow('Unexpected')
    }
    for (const revision of [-1, 0.5, '0', null, Number.MAX_SAFE_INTEGER]) {
      expect(() => validateResearchWrite({ workspace: workspace(), expectedRevision: revision })).toThrow('expectedRevision')
    }
  })
  it('rejects nested arbitrary fields, unsafe URLs, broken references, lengths and record counts', () => {
    const bad = workspace(); Object.assign(bad.sources[0]!, { ownerId: 'other' })
    expect(() => validateResearchWorkspace(bad)).toThrow('Unexpected')
    for (const url of ['javascript:alert(1)', 'https://user:password@example.org']) {
      expect(() => validateResearchWorkspace({ ...workspace(), sources: [{ ...source, url }] })).toThrow('Invalid research workspace')
    }
    expect(() => validateResearchWorkspace({ ...workspace(), sources: [{ ...source, title: 't'.repeat(501) }] })).toThrow('title')
    expect(() => validateResearchWorkspace({ ...workspace(), sources: Array.from({ length: 501 }, (_, i) => ({ ...source, id: String(i) })) })).toThrow('Limit research')
    expect(() => validateResearchWorkspace({ ...workspace(), decisions: [{ id: 'd', sourceId: 'missing', finding: 'finding', implementation: 'build', status: 'planned', createdAt: source.createdAt }] })).toThrow('Invalid research workspace')
  })
})
