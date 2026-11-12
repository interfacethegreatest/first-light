import type { IncomingMessage } from 'node:http'

export const MAX_JSON_BYTES = 1024 * 1024

/** Expected request errors; driver/configuration details never reach the response. */
export class RequestError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

/** Vercel may parse body before invoking us; local Node exposes the original stream. */
export async function readJson(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') {
    throw new RequestError(415, 'Use application/json.')
  }
  const encoding = request.headers['content-encoding']
  if (encoding && encoding.toLowerCase() !== 'identity') throw new RequestError(415, 'Compressed request bodies are not supported.')
  const declared = request.headers['content-length']
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_JSON_BYTES)) {
    request.resume()
    throw new RequestError(413, 'Research payload exceeds 1 MiB.')
  }

  const parsed = (request as IncomingMessage & { body?: unknown }).body
  if (parsed !== undefined) {
    let raw: string
    try { raw = Buffer.isBuffer(parsed) ? parsed.toString('utf8') : typeof parsed === 'string' ? parsed : JSON.stringify(parsed) }
    catch { throw new RequestError(400, 'Invalid JSON body.') }
    if (typeof raw !== 'string') throw new RequestError(400, 'Invalid JSON body.')
    if (Buffer.byteLength(raw) > MAX_JSON_BYTES) throw new RequestError(413, 'Research payload exceeds 1 MiB.')
    try { return JSON.parse(raw) as unknown }
    catch { throw new RequestError(400, 'Invalid JSON body.') }
  }

  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    const cleanup = () => {
      request.off('data', data); request.off('end', end)
      request.off('error', error); request.off('aborted', aborted)
    }
    const error = () => { cleanup(); reject(new RequestError(400, 'Could not read JSON body.')) }
    const aborted = () => { cleanup(); reject(new RequestError(400, 'Request was interrupted.')) }
    const end = () => { cleanup(); resolve(Buffer.concat(chunks).toString('utf8')) }
    const data = (chunk: Buffer | string) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += bytes.length
      if (size > MAX_JSON_BYTES) {
        cleanup(); request.resume(); reject(new RequestError(413, 'Research payload exceeds 1 MiB.'))
        return
      }
      chunks.push(bytes)
    }
    request.on('data', data); request.once('end', end)
    request.once('error', error); request.once('aborted', aborted)
  })
  try { return JSON.parse(raw) as unknown }
  catch { throw new RequestError(400, 'Invalid JSON body.') }
}
