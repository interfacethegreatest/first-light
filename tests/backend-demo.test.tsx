import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BackendDemo from '../src/components/backend/BackendDemo'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('backend demo button', () => {
  it('fetches only on click and prints the actual API response', async () => {
    const data = { message: 'Sample users read from MongoDB.', database: 'sample_mflix', collection: 'users', data: [{ name: 'Sample User' }] }
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => data })
    vi.stubGlobal('fetch', fetcher)
    render(<BackendDemo />)
    expect(fetcher).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Test backend' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sample users read from MongoDB.'))
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('/api/demo', expect.objectContaining({
      credentials: 'same-origin', cache: 'no-store', signal: expect.any(AbortSignal),
    }))
    expect(screen.getByRole('status').querySelector('pre')?.textContent).toBe(JSON.stringify(data, null, 2))
  })

  it('reports an unavailable database without showing fake sample users', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: 'Unavailable' }) }))
    render(<BackendDemo />)
    fireEvent.click(screen.getByRole('button', { name: 'Test backend' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Check MongoDB connectivity and read access to sample_mflix.users.'))
    expect(screen.getByRole('status').querySelector('pre')).toBeNull()
    expect(screen.getByRole('button', { name: 'Test backend' })).toBeEnabled()
  })

  it.each(['http', 'invalid-json', 'network'])('reports %s failure and allows retry', async failure => {
    const fetcher = vi.fn().mockImplementationOnce(() => failure === 'network'
      ? Promise.reject(new Error('offline'))
      : Promise.resolve({ ok: failure !== 'http', json: async () => { throw new Error('invalid') } }))
      .mockResolvedValue({ ok: true, json: async () => ({ message: 'Retry succeeded' }) })
    vi.stubGlobal('fetch', fetcher)
    render(<BackendDemo />)
    fireEvent.click(screen.getByRole('button', { name: 'Test backend' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not load the backend demo.'))
    fireEvent.click(screen.getByRole('button', { name: 'Test backend' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Retry succeeded'))
  })

  it('prevents duplicate requests and cancels pending work on unmount', () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockImplementation(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetcher)
    const { unmount } = render(<BackendDemo />)
    fireEvent.click(screen.getByRole('button', { name: 'Test backend' }))
    fireEvent.click(screen.getByRole('button', { name: 'Testing backend…' }))
    expect(fetcher).toHaveBeenCalledTimes(1)
    const signal = fetcher.mock.calls[0][1].signal as AbortSignal
    unmount()
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('times out a stalled request and restores the button', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_path, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    })))
    render(<BackendDemo />)
    fireEvent.click(screen.getByRole('button', { name: 'Test backend' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
    expect(screen.getByRole('status')).toHaveTextContent('The backend request timed out.')
    expect(screen.getByRole('button', { name: 'Test backend' })).toBeEnabled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
