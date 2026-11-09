import { useState } from 'react'
import {
  STORAGE_KEY, createDecision, createSource, emptyWorkspace, isImplementationStatus, parseWorkspace,
  type DecisionInput, type ImplementationStatus, type SourceInput, type Workspace,
} from './workspace'

interface Session {
  workspace: Workspace
  storageWarning: string | null
  canPersist: boolean
  savedRaw: string | null
}

function loadSession(): Session {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      workspace: emptyWorkspace(), canPersist: false, savedRaw: null,
      storageWarning: 'Browser storage is unavailable. Changes last only for this session. Export your workspace before leaving.',
    }
  }
  if (raw === null) return { workspace: emptyWorkspace(), storageWarning: null, canPersist: true, savedRaw: null }
  try {
    return { workspace: parseWorkspace(raw), storageWarning: null, canPersist: true, savedRaw: raw }
  } catch {
    return {
      workspace: emptyWorkspace(), canPersist: false, savedRaw: raw,
      storageWarning: 'Saved data could not be read. The original has been left untouched in browser storage. New changes are session-only; export them before leaving.',
    }
  }
}

export function useWorkspace() {
  const [session, setSession] = useState<Session>(loadSession)

  // Event handlers perform persistence once, outside React state updaters/effects.
  function save(workspace: Workspace) {
    const next = { ...session, workspace }
    if (session.canPersist) {
      try {
        // Never overwrite edits made in another tab since this session loaded/saved.
        if (localStorage.getItem(STORAGE_KEY) !== session.savedRaw) {
          next.canPersist = false
          next.storageWarning = 'Saved data changed in another tab. Your changes are session-only to avoid overwriting it. Export this workspace before reloading.'
        } else {
          next.savedRaw = JSON.stringify(workspace)
          localStorage.setItem(STORAGE_KEY, next.savedRaw)
        }
      } catch {
        next.canPersist = false
        next.storageWarning = 'Changes could not be saved in this browser. They remain available in this session. Export your workspace before leaving.'
      }
    }
    setSession(next)
  }

  function addSource(input: SourceInput): void {
    const source = createSource(input)
    save({ ...session.workspace, sources: [...session.workspace.sources, source] })
  }

  function addDecision(input: DecisionInput): void {
    const decision = createDecision(input, session.workspace)
    save({ ...session.workspace, decisions: [...session.workspace.decisions, decision] })
  }

  function updateDecisionStatus(id: string, status: ImplementationStatus): void {
    if (!isImplementationStatus(status)) throw new Error('Choose a valid implementation status.')
    if (!session.workspace.decisions.some(decision => decision.id === id)) throw new Error('Implementation decision not found.')
    save({
      ...session.workspace,
      decisions: session.workspace.decisions.map(decision => decision.id === id ? { ...decision, status } : decision),
    })
  }

  return {
    workspace: session.workspace,
    storageWarning: session.storageWarning,
    addSource, addDecision, updateDecisionStatus,
    exportWorkspace: () => JSON.stringify(session.workspace, null, 2),
  }
}
