import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { emptyWorkspace, STORAGE_KEY } from '../src/workspace'
import { ApiError } from '../src/client/research-api'

const api = vi.hoisted(() => ({ getBrowserSession: vi.fn(), getResearch: vi.fn(), writeResearch: vi.fn(), endBrowserSession: vi.fn() }))
vi.mock('../src/client/research-api', async importOriginal => ({ ...await importOriginal<typeof import('../src/client/research-api')>(), ...api }))
vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas', () => ({ default: () => null }))
vi.mock('../src/components/typography/FooterTextCanvas', () => ({ default: () => null }))
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: () => null }))

beforeEach(() => {
  vi.stubEnv('VITE_API_ENABLED', 'true')
  vi.stubGlobal('WebGLRenderingContext', undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })))
  Object.values(api).forEach(mock => mock.mockReset())
  api.getBrowserSession.mockResolvedValue({ authenticated: true, user: { id: 'A', name: 'A' }, expiresAt: new Date(Date.now() + 60000).toISOString() })
  api.getResearch.mockResolvedValue({ workspace: emptyWorkspace(), revision: 0 })
  api.endBrowserSession.mockResolvedValue(undefined)
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('account integration in the actual application', () => {
  it('shows confirmed logout after the account boundary remounts its native controls', async () => {
    render(<App />)
    await screen.findByText('Signed in as A. Research is stored in your account.')
    fireEvent.change(screen.getByRole('textbox', { name: 'Source title' }), { target: { value: 'Private input' } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }))
    await screen.findByText('Signed out. Refresh account to continue with the browser workspace.')
    expect(api.endBrowserSession).toHaveBeenCalledTimes(1)
    expect(screen.queryByDisplayValue('Private input')).not.toBeInTheDocument()
    expect(screen.queryByText('Signed in as A. Research is stored in your account.')).not.toBeInTheDocument()
  })

  it('retains the entered native source draft after a409 and clears it only after a confirmed save', async () => {
    render(<App />)
    await screen.findByText('Signed in as A. Research is stored in your account.')
    const title = screen.getByRole('textbox', { name: 'Source title' })
    const url = screen.getByRole('textbox', { name: 'Source URL' })
    fireEvent.change(title, { target: { value: 'Keep this draft' } })
    fireEvent.change(url, { target: { value: 'https://example.org/paper' } })
    api.writeResearch.mockRejectedValueOnce(new ApiError(409, 'Research changed. Refresh before saving.'))
    fireEvent.submit(title.closest('form')!)
    await waitFor(() => expect(screen.getAllByText('Research changed. Refresh before saving.').length).toBeGreaterThan(0))
    expect(screen.getByRole('textbox', { name: 'Source title' })).toBe(title)
    expect(title).toHaveValue('Keep this draft')
    expect(url).toHaveValue('https://example.org/paper')
    api.writeResearch.mockImplementationOnce(async (_userId, workspace) => ({ workspace, revision: 1 }))
    fireEvent.submit(title.closest('form')!)
    await screen.findByText('Source added to your research library.')
    expect(title).toHaveValue('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clears native/scene drafts and generated source panels on verified account switching', async () => {
    render(<App />)
    await screen.findByText('Signed in as A. Research is stored in your account.')
    const title = screen.getByRole('textbox', { name: 'Source title' })
    const draft = screen.getByRole('textbox', { name: 'Research draft' })
    fireEvent.change(title, { target: { value: 'Private A input' } })
    fireEvent.change(draft, { target: { value: 'Private A draft' } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add source' }))
    expect(document.querySelectorAll('[data-source-reveal]').length).toBe(3)
    api.getBrowserSession.mockResolvedValue({ authenticated: true, user: { id: 'B', name: 'B' }, expiresAt: new Date(Date.now() + 60000).toISOString() })
    await act(async () => window.dispatchEvent(new Event('focus')))
    await screen.findByText('Signed in as B. Research is stored in your account.')
    expect(screen.getByRole('textbox', { name: 'Source title' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toHaveValue('')
    expect(document.querySelectorAll('[data-source-reveal]').length).toBe(0)
    expect(screen.queryByDisplayValue('Private A input')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('Private A draft')).not.toBeInTheDocument()
  })
})
