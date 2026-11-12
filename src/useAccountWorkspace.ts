import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from './useWorkspace'
import {
  STORAGE_KEY, createDecision, createSource, emptyWorkspace, isImplementationStatus, parseWorkspace,
  type DecisionInput, type ImplementationStatus, type SourceInput, type Workspace,
} from './workspace'
import {
  ApiError, endBrowserSession, getBrowserSession, getResearch, writeResearch,
  type ResearchSnapshot, type SessionUser,
} from './client/research-api'

type Phase = 'disabled' | 'checking' | 'anonymous' | 'authenticated' | 'locked' | 'signed-out'
interface AccountState {
  phase: Phase
  user: SessionUser | null
  research: ResearchSnapshot | null
  scopeKey: string
  error: string | null
  busy: boolean
}
const AUTH_EVENT_KEY = 'first-light.auth.changed'

/** No automatic import and no persisted account cache. The original local data stays local. */
export function useAccountWorkspace(enabled = import.meta.env.VITE_API_ENABLED === 'true') {
  const local = useWorkspace()
  const initial: AccountState = {
    phase: enabled ? 'checking' : 'disabled', user: null, research: null,
    scopeKey: enabled ? 'pending' : 'local', error: null, busy: false,
  }
  const [state, setState] = useState<AccountState>(initial)
  const latest = useRef(state)
  const generation = useRef(0)
  const controllers = useRef(new Set<AbortController>())
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)
  const logoutBlocked = useRef(false)
  const logoutUnconfirmed = useRef(false)

  const replace = useCallback((next: AccountState) => {
    latest.current = next
    if (mounted.current) setState(next)
  }, [])
  const invalidate = useCallback(() => {
    generation.current += 1
    for (const controller of controllers.current) controller.abort()
    controllers.current.clear()
    if (expiryTimer.current !== null) clearTimeout(expiryTimer.current)
    expiryTimer.current = null
    return generation.current
  }, [])
  function begin() {
    const controller = new AbortController()
    controllers.current.add(controller)
    return controller
  }
  function announce(type: 'logout-start' | 'changed') {
    try { localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify({ type, nonce: crypto.randomUUID() })) }
    catch { /* Focus revalidation remains available. */ }
  }

  const refresh = useCallback(async () => {
    if (!enabled || logoutBlocked.current) return
    const epoch = invalidate()
    const controller = new AbortController()
    controllers.current.add(controller)
    const previous = latest.current
    // Hide old research while another tab may have changed the shared cookie.
    replace({ ...previous, phase: 'checking', user: null, research: null, busy: false, error: null })
    try {
      const session = await getBrowserSession(controller.signal)
      if (epoch !== generation.current || !mounted.current) return
      if (!session.authenticated) {
        replace({ phase: 'anonymous', user: null, research: null, scopeKey: 'local', error: null, busy: false })
        return
      }
      const research = await getResearch(session.user.id, controller.signal)
      if (epoch !== generation.current || !mounted.current) return
      replace({ phase: 'authenticated', user: session.user, research, scopeKey: `account:${session.user.id}`, error: null, busy: false })
      const expire = () => {
        if (epoch !== generation.current || !mounted.current) return
        const remaining = Date.parse(session.expiresAt) - Date.now()
        if (remaining > 0) { expiryTimer.current = setTimeout(expire, Math.min(remaining, 2147483647)); return }
        invalidate()
        replace({ phase: 'locked', user: null, research: null, scopeKey: `expired:${generation.current}`, busy: false, error: 'Your session expired. Refresh your account after signing in again.' })
      }
      expire()
    } catch (error) {
      if (epoch !== generation.current || !mounted.current) return
      replace({ phase: 'locked', user: null, research: null, scopeKey: `locked:${epoch}`, busy: false,
        error: error instanceof Error ? error.message : 'The account service is unavailable. Refresh to try again.' })
    } finally { controllers.current.delete(controller) }
  }, [enabled, invalidate, replace])

  useEffect(() => {
    mounted.current = true
    if (!enabled) return () => { mounted.current = false; invalidate() }
    void refresh()
    const visible = () => { if (document.visibilityState === 'visible') void refresh() }
    const focused = () => { if (document.visibilityState === 'visible') void refresh() }
    const changed = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT_KEY) return
      let started = false
      try { started = JSON.parse(event.newValue ?? '{}').type === 'logout-start' } catch { /* Treat legacy notices as a change. */ }
      if (started) {
        const epoch = invalidate()
        logoutBlocked.current = true
        logoutUnconfirmed.current = true
        replace({ phase: 'locked', user: null, research: null, scopeKey: `logout:${epoch}`, busy: false, error: null })
      } else { logoutBlocked.current = false; logoutUnconfirmed.current = false; void refresh() }
    }
    window.addEventListener('focus', focused)
    window.addEventListener('storage', changed)
    document.addEventListener('visibilitychange', visible)
    return () => {
      mounted.current = false
      invalidate()
      window.removeEventListener('focus', focused)
      window.removeEventListener('storage', changed)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [enabled, invalidate, refresh, replace])

  const isLocal = state.phase === 'disabled' || state.phase === 'anonymous'
  const workspace = isLocal ? local.workspace : state.research?.workspace ?? emptyWorkspace()

  async function save(workspace: Workspace, importing = false): Promise<void> {
    const current = latest.current
    if (current.phase !== 'authenticated' || !current.user || !current.research) throw new Error('Sign in and load your account before saving research.')
    if (current.busy) throw new Error('A research request is already in progress. Please wait.')
    const epoch = generation.current
    const controller = begin()
    replace({ ...current, busy: true, error: null })
    try {
      const research = await writeResearch(current.user.id, workspace, current.research.revision, controller.signal, importing)
      if (epoch !== generation.current || !mounted.current) throw new Error('The account changed. This response was discarded.')
      replace({ ...current, research, busy: false })
    } catch (error) {
      if (epoch === generation.current && mounted.current) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 409 && error.message.toLowerCase().includes('account'))) {
          invalidate()
          replace({ phase: 'locked', user: null, research: null, scopeKey: `locked:${generation.current}`, busy: false, error: 'Your session changed. Refresh your account before continuing.' })
        } else {
          replace({ ...current, busy: false, error: error instanceof Error ? error.message : 'Research could not be saved.' })
        }
      }
      throw error
    } finally { controllers.current.delete(controller) }
  }

  async function addSource(input: SourceInput): Promise<void> {
    if (isLocal) { local.addSource(input); return }
    const source = createSource(input)
    await save({ ...workspace, sources: [...workspace.sources, source] })
  }
  async function addDecision(input: DecisionInput): Promise<void> {
    if (isLocal) { local.addDecision(input); return }
    const decision = createDecision(input, workspace)
    await save({ ...workspace, decisions: [...workspace.decisions, decision] })
  }
  async function updateDecisionStatus(id: string, status: ImplementationStatus): Promise<void> {
    if (isLocal) { local.updateDecisionStatus(id, status); return }
    if (!isImplementationStatus(status)) throw new Error('Choose a valid implementation status.')
    if (!workspace.decisions.some(decision => decision.id === id)) throw new Error('Implementation decision not found.')
    await save({ ...workspace, decisions: workspace.decisions.map(decision => decision.id === id ? { ...decision, status } : decision) })
  }

  async function importBrowserResearch(): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('No saved research was found in this browser. You can choose an exported JSON file instead.')
    await save(parseWorkspace(raw), true)
  }
  async function importResearchFile(file: File): Promise<void> {
    if (file.size > 1024 * 1024) throw new Error('Choose a research export smaller than 1 MiB.')
    const epoch = generation.current
    const scope = latest.current.scopeKey
    const raw = await file.text()
    if (epoch !== generation.current || scope !== latest.current.scopeKey) throw new Error('The account changed. Choose the file again after sign-in.')
    await save(parseWorkspace(raw), true)
  }
  async function logout(all = false): Promise<void> {
    const epoch = invalidate()
    logoutBlocked.current = true
    logoutUnconfirmed.current = true
    replace({ phase: 'locked', user: null, research: null, scopeKey: `logout:${epoch}`, busy: true, error: null })
    announce('logout-start')
    const controller = begin()
    try {
      await endBrowserSession(all, controller.signal)
      if (epoch !== generation.current || !mounted.current) return
      logoutUnconfirmed.current = false
      replace({ ...latest.current, phase: 'signed-out', busy: false, error: null })
      announce('changed')
    } catch (error) {
      if (epoch === generation.current && mounted.current) replace({ ...latest.current, busy: false,
        error: 'Account data was cleared here, but server logout failed. Retry logout before using another account.' })
      throw error
    } finally { controllers.current.delete(controller) }
  }

  return {
    workspace, storageWarning: isLocal ? local.storageWarning : state.error,
    addSource, addDecision, updateDecisionStatus,
    exportWorkspace: () => {
      if (!isLocal && state.phase !== 'authenticated') throw new Error('Load your account before exporting research.')
      return JSON.stringify(workspace, null, 2)
    },
    account: {
      enabled, phase: state.phase, user: state.user, error: state.error, busy: state.busy,
      scopeKey: state.scopeKey, checking: state.phase === 'checking',
      locked: !isLocal && state.phase !== 'authenticated',
      refresh: () => {
        if (logoutUnconfirmed.current) return Promise.reject(new Error('Server logout is not confirmed. Retry logout before refreshing your account.'))
        logoutBlocked.current = false
        return refresh()
      },
      logout, importBrowserResearch, importResearchFile,
    },
  }
}

export type AccountWorkspace = ReturnType<typeof useAccountWorkspace>
