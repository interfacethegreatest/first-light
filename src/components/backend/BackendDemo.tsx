import { useEffect, useRef, useState } from 'react'

/** On-demand API smoke test; deliberately independent of accounts and MongoDB. */
export default function BackendDemo() {
  const request = useRef<{ controller: AbortController; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => () => {
    const pending = request.current
    request.current = null
    if (pending) {
      clearTimeout(pending.timer)
      pending.controller.abort()
    }
  }, [])

  async function testBackend() {
    if (request.current) return
    setBusy(true)
    setOutput('')
    setError('')
    const controller = new AbortController()
    let timedOut = false
    const pending = {
      controller,
      timer: setTimeout(() => { timedOut = true; controller.abort() }, 10_000),
    }
    request.current = pending
    try {
      const response = await fetch('/api/demo', {
        signal: controller.signal, credentials: 'same-origin', cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Backend request failed.')
      const data: unknown = await response.json()
      if (request.current === pending) setOutput(JSON.stringify(data, null, 2))
    } catch {
      if (request.current === pending) setError(timedOut
        ? 'The backend request timed out. Please try again.'
        : 'Could not load the backend demo. Please try again.')
    } finally {
      clearTimeout(pending.timer)
      if (request.current === pending) {
        request.current = null
        setBusy(false)
      }
    }
  }

  return (
    <section className="notice" aria-label="Backend demo" aria-busy={busy}>
      <button type="button" className="button button-secondary" disabled={busy}
        onClick={() => void testBackend()}>{busy ? 'Testing backend…' : 'Test backend'}</button>
      <p>Dummy API data only. This checks the backend connection, not MongoDB.</p>
      <div role="status" aria-live="polite">
        {output && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{output}</pre>}
        {error && <p>{error}</p>}
      </div>
    </section>
  )
}
