import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, endBrowserSession, getBrowserSession, getResearch, writeResearch } from '../src/client/research-api'
import { emptyWorkspace } from '../src/workspace'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('same-origin account client', () => {
  it('uses HttpOnly cookies implicitly and sends an account precondition, never a body owner', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ workspace: emptyWorkspace(), revision: 1 }), { status: 200 }))
    vi.stubGlobal('fetch', fetcher)
    const controller = new AbortController()
    await writeResearch('verified-A', emptyWorkspace(), 0, controller.signal)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('/api/research')
    expect(init).toMatchObject({ method: 'PUT', credentials: 'same-origin', cache: 'no-store', signal: expect.any(AbortSignal),
      headers: { 'X-First-Light-Account': 'verified-A', 'Content-Type': 'application/json' } })
    expect(JSON.parse(init.body)).toEqual({ workspace: emptyWorkspace(), expectedRevision: 0 })
    expect(localStorage.length).toBe(0)
  })

  it('uses the explicit import route and rejects invalid successful responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ workspace: emptyWorkspace(), revision: 2 }), { status: 200 }))
    vi.stubGlobal('fetch', fetcher)
    await writeResearch('A', emptyWorkspace(), 1, undefined, true)
    expect(fetcher.mock.calls[0][0]).toBe('/api/research/import')
    expect(fetcher.mock.calls[0][1].method).toBe('POST')
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ revision: -1, workspace: emptyWorkspace() })))
    await expect(getResearch('A')).rejects.toThrow('Invalid research response')
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true, user: { id: 'A' }, expiresAt: 'invalid' })))
    await expect(getBrowserSession()).rejects.toThrow('Invalid session response')
  })

  it('preserves safe API errors and recognizes logout204 without parsing JSON', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Revision changed.' }), { status: 409 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetcher)
    await expect(getResearch('A')).rejects.toEqual(new ApiError(409, 'Revision changed.'))
    await endBrowserSession(true)
    expect(fetcher.mock.calls[1][0]).toBe('/api/auth/logout-all')
  })

  it('bounds stalled requests, propagates account cancellation and cleans timers/listeners', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    vi.stubGlobal('fetch', fetcher)
    const owner = new AbortController()
    const remove = vi.spyOn(owner.signal, 'removeEventListener')
    const cancelled = getResearch('A', owner.signal)
    const rejected = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
    owner.abort()
    await rejected
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
    expect(vi.getTimerCount()).toBe(0)
    const stalled = getResearch('A')
    const timeout = expect(stalled).rejects.toMatchObject({ status: 503, message: expect.stringContaining('timed out') })
    await vi.advanceTimersByTimeAsync(20_000)
    await timeout
    expect(vi.getTimerCount()).toBe(0)
  })
})
