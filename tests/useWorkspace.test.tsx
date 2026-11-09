import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useWorkspace } from '../src/useWorkspace'
import { STORAGE_KEY, emptyWorkspace, parseWorkspace, type ImplementationStatus, type SourceInput } from '../src/workspace'

const sourceInput: SourceInput = {
  title: 'Test source',
  url: 'https://example.org/test-source',
  notes: 'For automated behavior tests only.',
}

describe('workspace persistence and recovery', () => {
  it('starts empty, persists a linked decision and status, and restores them after remount', () => {
    const first = renderHook(() => useWorkspace())
    expect(first.result.current.workspace).toEqual(emptyWorkspace())
    expect(first.result.current.storageWarning).toBeNull()

    act(() => first.result.current.addSource(sourceInput))
    const sourceId = first.result.current.workspace.sources[0].id
    act(() => first.result.current.addDecision({
      sourceId, finding: 'Test observation', implementation: 'Test prototype behavior',
    }))
    const decisionId = first.result.current.workspace.decisions[0].id
    act(() => first.result.current.updateDecisionStatus(decisionId, 'building'))
    expect(first.result.current.workspace.decisions[0].status).toBe('building')
    act(() => first.result.current.updateDecisionStatus(decisionId, 'validated'))

    const snapshot = first.result.current.workspace
    expect(parseWorkspace(first.result.current.exportWorkspace())).toEqual(snapshot)
    expect(parseWorkspace(localStorage.getItem(STORAGE_KEY)!)).toEqual(snapshot)

    first.unmount()
    const restored = renderHook(() => useWorkspace())
    expect(restored.result.current.workspace).toEqual(snapshot)
    expect(restored.result.current.workspace.decisions[0].status).toBe('validated')
    expect(restored.result.current.storageWarning).toBeNull()
  })

  it('does not save invalid input or allow an invalid status/reference', () => {
    const { result } = renderHook(() => useWorkspace())
    expect(() => act(() => result.current.addSource({ ...sourceInput, url: 'javascript:alert(1)' }))).toThrow(Error)
    expect(result.current.workspace).toEqual(emptyWorkspace())
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    act(() => result.current.addSource(sourceInput))
    const sourceId = result.current.workspace.sources[0].id
    expect(() => act(() => result.current.addDecision({ sourceId: 'missing', finding: 'Finding', implementation: 'Feature' }))).toThrow(Error)
    act(() => result.current.addDecision({ sourceId, finding: 'Finding', implementation: 'Feature' }))
    const decisionId = result.current.workspace.decisions[0].id
    const savedBefore = result.current.exportWorkspace()

    expect(() => act(() => result.current.updateDecisionStatus('missing', 'building'))).toThrow(Error)
    expect(() => act(() => result.current.updateDecisionStatus(decisionId, 'other' as ImplementationStatus))).toThrow(Error)
    expect(result.current.exportWorkspace()).toBe(savedBefore)
    expect(parseWorkspace(localStorage.getItem(STORAGE_KEY)!)).toEqual(result.current.workspace)
  })

  it.each(['{broken', '{"version":2,"sources":[],"decisions":[]}']) (
    'preserves unreadable saved data and keeps new records exportable in memory: %s', raw => {
      localStorage.setItem(STORAGE_KEY, raw)
      const { result } = renderHook(() => useWorkspace())

      expect(result.current.workspace).toEqual(emptyWorkspace())
      expect(result.current.storageWarning).toEqual(expect.any(String))
      act(() => result.current.addSource(sourceInput))

      expect(result.current.workspace.sources).toHaveLength(1)
      expect(parseWorkspace(result.current.exportWorkspace()).sources[0].title).toBe(sourceInput.title)
      expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
      expect(result.current.storageWarning).not.toBeNull()
    },
  )

  it('keeps the session usable when browser storage cannot be read', () => {
    const stored = JSON.stringify(emptyWorkspace())
    localStorage.setItem(STORAGE_KEY, stored)
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError')
    })
    const { result } = renderHook(() => useWorkspace())

    expect(result.current.storageWarning).toEqual(expect.any(String))
    act(() => result.current.addSource(sourceInput))
    expect(parseWorkspace(result.current.exportWorkspace()).sources).toHaveLength(1)

    getItem.mockRestore()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored)
  })

  it('warns on write failure while retaining both the saved copy and session changes', () => {
    const { result } = renderHook(() => useWorkspace())
    act(() => result.current.addSource(sourceInput))
    const previousSaved = localStorage.getItem(STORAGE_KEY)
    const sourceId = result.current.workspace.sources[0].id
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    act(() => result.current.addDecision({ sourceId, finding: 'Finding', implementation: 'Feature' }))
    expect(result.current.workspace.decisions).toHaveLength(1)
    expect(result.current.storageWarning).toEqual(expect.any(String))
    expect(parseWorkspace(result.current.exportWorkspace()).decisions).toHaveLength(1)

    setItem.mockRestore()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(previousSaved)
    act(() => result.current.updateDecisionStatus(result.current.workspace.decisions[0].id, 'building'))
    expect(result.current.workspace.decisions[0].status).toBe('building')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(previousSaved)
  })

  it('does not overwrite saved changes from another tab', () => {
    const firstTab = renderHook(() => useWorkspace())
    const secondTab = renderHook(() => useWorkspace())
    act(() => secondTab.result.current.addSource({ ...sourceInput, title: 'Source from tab two' }))
    const savedBySecondTab = localStorage.getItem(STORAGE_KEY)

    act(() => firstTab.result.current.addSource({ ...sourceInput, title: 'Source from tab one' }))

    expect(localStorage.getItem(STORAGE_KEY)).toBe(savedBySecondTab)
    expect(firstTab.result.current.storageWarning).toEqual(expect.any(String))
    expect(parseWorkspace(firstTab.result.current.exportWorkspace()).sources[0].title).toBe('Source from tab one')
    expect(secondTab.result.current.workspace.sources[0].title).toBe('Source from tab two')
  })

  it('adds and saves each user operation once under React StrictMode', () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper: StrictMode })
    act(() => result.current.addSource(sourceInput))
    const sourceId = result.current.workspace.sources[0].id
    act(() => result.current.addDecision({ sourceId, finding: 'Finding', implementation: 'Feature' }))

    const saved = parseWorkspace(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.sources).toHaveLength(1)
    expect(saved.decisions).toHaveLength(1)
    expect(result.current.workspace).toEqual(saved)
    expect(result.current.storageWarning).toBeNull()
  })
})
