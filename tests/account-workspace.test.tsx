import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, emptyWorkspace, type Workspace } from '../src/workspace'
import { ApiError } from '../src/client/research-api'

const api = vi.hoisted(() => ({ getBrowserSession: vi.fn(), getResearch: vi.fn(), writeResearch: vi.fn(), endBrowserSession: vi.fn() }))
vi.mock('../src/client/research-api', async importOriginal => ({ ...await importOriginal<typeof import('../src/client/research-api')>(), ...api }))
import { useAccountWorkspace } from '../src/useAccountWorkspace'

const source = { title: 'New source', url: 'https://example.org/paper', notes: 'draft notes' }
const workspace = (title: string): Workspace => ({ version: 1, sources: [{ id: title, title, url: 'https://example.org/paper', notes: '', createdAt: '2026-11-12T00:00:00.000Z' }], decisions: [] })
const signedIn = (id: string) => ({ authenticated: true as const, user: { id, name: id }, expiresAt: new Date(Date.now() + 60000).toISOString() })
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
beforeEach(() => {
  Object.values(api).forEach(mock => mock.mockReset())
  api.getBrowserSession.mockResolvedValue(signedIn('A'))
  api.getResearch.mockResolvedValue({ workspace: emptyWorkspace(), revision: 0 })
  api.endBrowserSession.mockResolvedValue(undefined)
})
afterEach(() => { vi.useRealTimers() })

describe('account-owned research integration', () => {
  it('retains original browser behavior with the feature disabled and never contacts an API', async () => {
    const { result } = renderHook(() => useAccountWorkspace(false))
    await act(async () => result.current.addSource(source))
    expect(result.current.workspace.sources[0].title).toBe('New source')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).sources).toHaveLength(1)
    Object.values(api).forEach(mock => expect(mock).not.toHaveBeenCalled())
  })

  it('shows an empty signed-in library without automatically importing browser records', async () => {
    const raw = JSON.stringify(workspace('Local only'))
    localStorage.setItem(STORAGE_KEY, raw)
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.account.phase).toBe('authenticated'))
    expect(result.current.workspace).toEqual(emptyWorkspace())
    expect(api.writeResearch).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    api.writeResearch.mockResolvedValue({ workspace: workspace('Local only'), revision: 1 })
    await act(async () => result.current.account.importBrowserResearch())
    expect(api.writeResearch).toHaveBeenCalledWith('A', workspace('Local only'), 0, expect.any(AbortSignal), true)
    expect(result.current.workspace.sources[0].title).toBe('Local only')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  it('supports explicit exported JSON files without changing original browser data', async () => {
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.account.phase).toBe('authenticated'))
    api.writeResearch.mockResolvedValue({ workspace: workspace('Imported'), revision: 1 })
    const file = { size: 100, text: async () => JSON.stringify(workspace('Imported')) } as File
    await act(async () => result.current.account.importResearchFile(file))
    expect(result.current.workspace.sources[0].title).toBe('Imported')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    await expect(result.current.account.importResearchFile({ size: 2 ** 21 } as File)).rejects.toThrow('smaller than 1 MiB')
  })

  it('keeps current research and rejects a conflicting save so the UI can retain its draft', async () => {
    api.getResearch.mockResolvedValue({ workspace: workspace('Saved'), revision: 3 })
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.account.phase).toBe('authenticated'))
    api.writeResearch.mockRejectedValue(new ApiError(409, 'Research changed. Refresh before saving.'))
    await act(async () => { await expect(result.current.addSource(source)).rejects.toThrow('Research changed') })
    expect(result.current.workspace).toEqual(workspace('Saved'))
    expect(result.current.account.phase).toBe('authenticated')
    expect(result.current.account.error).toContain('Research changed')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('immediately clears owner A on logout and discards an already pending late response', async () => {
    const pending = deferred<{ workspace: Workspace; revision: number }>()
    api.getResearch.mockResolvedValue({ workspace: workspace('Private A'), revision: 1 })
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.workspace.sources).toHaveLength(1))
    api.writeResearch.mockReturnValue(pending.promise)
    let saving!: Promise<void>
    act(() => { saving = result.current.addSource(source) })
    const rejected = expect(saving).rejects.toThrow('discarded')
    await act(async () => result.current.account.logout())
    expect(result.current.account.phase).toBe('signed-out')
    expect(result.current.workspace).toEqual(emptyWorkspace())
    expect(result.current.account.user).toBeNull()
    await act(async () => { pending.resolve({ workspace: workspace('Late A'), revision: 2 }); await rejected })
    expect(result.current.workspace).toEqual(emptyWorkspace())
    expect(api.writeResearch.mock.calls[0][3].aborted).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps data locked and exposes retry after server logout fails', async () => {
    api.getResearch.mockResolvedValue({ workspace: workspace('Private A'), revision: 1 })
    api.endBrowserSession.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.account.phase).toBe('authenticated'))
    await act(async () => { await expect(result.current.account.logout()).rejects.toThrow('offline') })
    expect(result.current.workspace).toEqual(emptyWorkspace())
    expect(result.current.account.error).toContain('server logout failed')
    await expect(result.current.account.refresh()).rejects.toThrow('logout is not confirmed')
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(result.current.account.phase).toBe('locked')
    api.endBrowserSession.mockResolvedValue(undefined)
    await act(async () => result.current.account.logout())
    expect(result.current.account.error).toBeNull()
    expect(api.endBrowserSession).toHaveBeenCalledTimes(2)
  })

  it('gates old research during revalidation, accepts B and ignores old A fetches', async () => {
    api.getResearch.mockResolvedValue({ workspace: workspace('Private A'), revision: 1 })
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.workspace.sources[0]?.title).toBe('Private A'))
    const lateA = deferred<{ workspace: Workspace; revision: number }>()
    api.getResearch.mockReturnValueOnce(lateA.promise)
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(result.current.account.checking).toBe(true)
    expect(result.current.workspace).toEqual(emptyWorkspace())
    await waitFor(() => expect(api.getResearch).toHaveBeenCalledTimes(2))
    api.getBrowserSession.mockResolvedValue(signedIn('B'))
    api.getResearch.mockResolvedValue({ workspace: workspace('Private B'), revision: 7 })
    await act(async () => result.current.account.refresh())
    expect(result.current.account.scopeKey).toBe('account:B')
    expect(result.current.workspace.sources[0].title).toBe('Private B')
    await act(async () => lateA.resolve({ workspace: workspace('Late private A'), revision: 2 }))
    expect(result.current.workspace.sources[0].title).toBe('Private B')
  })

  it.each([401, 409])('locks immediately on session/account precondition failure %s', async status => {
    api.getResearch.mockResolvedValue({ workspace: workspace('Private A'), revision: 1 })
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.account.phase).toBe('authenticated'))
    api.writeResearch.mockRejectedValue(new ApiError(status, 'Account changed. Refresh session.'))
    await act(async () => { await expect(result.current.addSource(source)).rejects.toThrow('Account changed') })
    expect(result.current.account.phase).toBe('locked')
    expect(result.current.workspace).toEqual(emptyWorkspace())
  })

  it('handles another tab beginning logout without re-showing its still-valid cookie data', async () => {
    const { result } = renderHook(() => useAccountWorkspace(true))
    await waitFor(() => expect(result.current.account.phase).toBe('authenticated'))
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'first-light.auth.changed', newValue: '{"type":"logout-start"}' })))
    expect(result.current.account.phase).toBe('locked')
    expect(api.getBrowserSession).toHaveBeenCalledTimes(1)
    expect(result.current.workspace).toEqual(emptyWorkspace())
  })

  it('clears cached account research at the verified session expiry even without another request', async () => {
    vi.useFakeTimers()
    api.getBrowserSession.mockResolvedValue({ ...signedIn('A'), expiresAt: new Date(Date.now() + 1000).toISOString() })
    api.getResearch.mockResolvedValue({ workspace: workspace('Private A'), revision: 1 })
    const { result } = renderHook(() => useAccountWorkspace(true))
    await act(async () => {})
    expect(result.current.account.phase).toBe('authenticated')
    await act(async () => vi.advanceTimersByTime(1000))
    expect(result.current.account.phase).toBe('locked')
    expect(result.current.workspace).toEqual(emptyWorkspace())
    expect(result.current.account.error).toContain('session expired')
  })

  it('cleans activity listeners/requests on unmount and tolerates React StrictMode replay', async () => {
    const view = renderHook(() => useAccountWorkspace(true), { wrapper: StrictMode })
    await waitFor(() => expect(view.result.current.account.phase).toBe('authenticated'))
    const calls = api.getBrowserSession.mock.calls.length
    view.unmount()
    act(() => { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new StorageEvent('storage', { key: 'first-light.auth.changed' })) })
    expect(api.getBrowserSession).toHaveBeenCalledTimes(calls)
    expect(api.getBrowserSession.mock.calls[0][0].aborted).toBe(true)
  })
})
