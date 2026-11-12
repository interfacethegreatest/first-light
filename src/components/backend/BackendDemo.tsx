import { useEffect, useRef, useState } from 'react'

/** Read-only Atlas sample lookup; account/research data is never requested here. */
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
      const data: unknown = await response.json()
      if (!response.ok) {
        if (request.current === pending) setError(response.status === 503
          ? 'Could not read sample users. Check MongoDB connectivity and read access to sample_mflix.users.'
          : 'Could not load the backend demo. Please try again.')
        return
      }
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
      <p>Read up to three sample names from MongoDB: sample_mflix.users. No records are changed.</p>
      <div role="status" aria-live="polite">
        {output && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{output}</pre>}
        {error && <p>{error}</p>}
      </div>
    </section>
  )
}
