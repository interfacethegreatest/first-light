import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import GlassPanelCanvas from '../src/components/glass-panel-3d/GlassPanelCanvas'
import ResearchDraftPanel from '../src/components/glass-panel-3d/ResearchDraftPanel'

vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas', () => ({ default: vi.fn() }))
vi.mock('../src/components/typography/FooterTextCanvas', () => ({ default: () => null }))
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: () => null }))

const KEY = 'first-light.workspace.v1'
const SEED = { version: 1, sources: [{ id: 'main-source-1', title: 'Existing research evidence', url: 'https://example.org/main-evidence', notes: 'Saved research', createdAt: '2026-01-01T00:00:00.000Z' }], decisions: [] }

function environment(webgl = false) {
  vi.stubGlobal('WebGLRenderingContext', webgl ? class {} : undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  vi.stubGlobal('matchMedia', vi.fn((name: string) => ({ matches: name.includes('reduced-motion'), addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })))
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    observe(target: Element) { this.target = target }
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', Observer)
  return (target: Element) => act(() => observers.filter(o => o.target === target).forEach(o => o.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], o as unknown as IntersectionObserver)))
}

beforeEach(() => { vi.mocked(GlassPanelCanvas).mockImplementation(() => <div data-testid="main-glass-gpu-boundary" />) })
afterEach(() => { vi.unstubAllGlobals() })

describe('glass card on the actual main workspace', () => {
  it('places the original plain-heading panel after the workspace without mounting main-page Html or 3D-heading scenes', () => {
    environment()
    const view = render(<App />)
    const section = screen.getByRole('region', { name: 'Idea draft' })
    expect(section).toHaveAttribute('id', 'glass-workspace')
    expect(section).toHaveAttribute('data-main-glass', '')
    expect(within(section).getAllByRole('heading', { name: 'A little more depth.', level: 2 })).toHaveLength(1)
    expect(within(section).getByRole('heading', { name: 'A little more depth.' })).toBeVisible()
    const draft = within(section).getByRole('textbox', { name: 'Research draft' })
    expect(draft.tagName).toBe('TEXTAREA')
    expect(draft.closest('[aria-hidden="true"]')).toBeNull()
    expect(within(section).getByText('FIRST LIGHT / REUSABLE COMPONENT')).toBeInTheDocument()
    expect(within(section).getByText('Your content stays in HTML. A separate Three.js layer gives this panel its glass surface.')).toBeInTheDocument()
    expect(within(section).getByText('Temporary draft · Clears on reload')).toBeInTheDocument()
    expect(section.querySelectorAll('[data-glass-panel]')).toHaveLength(1)
    expect(section.querySelector('[data-html-glass-card], [data-three-d-heading]')).not.toBeInTheDocument()
    const workspace = view.container.querySelector('.workspace-grid')!, next = view.container.querySelector('.next-step')!
    expect(workspace.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(section.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the idea draft independent of saved workspace and existing source/decision actions', async () => {
    environment();localStorage.setItem(KEY, JSON.stringify(SEED))
    const user = userEvent.setup(), view = render(<App />)
    const idea = screen.getByRole('textbox', { name: 'Research draft' })
    await user.type(idea, 'Private temporary idea')
    const sourceTitle = view.container.querySelector<HTMLInputElement>('#source-title')!
    await user.type(sourceTitle, 'Unsaved metadata draft')
    const add = screen.getByRole('button', { name: 'Add source' })
    await user.click(add);await user.keyboard('{Enter}')
    expect(view.container.querySelectorAll('#source-sections [data-new-user-card]')).toHaveLength(6)
    expect(sourceTitle).toHaveValue('Unsaved metadata draft')
    expect(idea).toHaveValue('Private temporary idea')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(SEED)
    await user.selectOptions(view.container.querySelector('#decision-source')!, 'main-source-1')
    await user.type(view.container.querySelector('#research-finding')!, 'An existing research finding')
    await user.type(view.container.querySelector('#implementation-plan')!, 'Build and test the smallest application')
    await user.click(screen.getByRole('button', { name: 'Add decision' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status for decision 1' }), 'building')
    const saved = JSON.parse(localStorage.getItem(KEY)!)
    expect(saved.sources).toEqual(SEED.sources)
    expect(saved.decisions).toHaveLength(1)
    expect(saved.decisions[0]).toMatchObject({ sourceId: 'main-source-1', status: 'building' })
    expect(JSON.stringify(saved)).not.toContain('Private temporary idea')
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toBe(idea)
    expect(idea).toHaveValue('Private temporary idea')
  })

  it('preserves both native draft areas and saved data when the new card renderer fails', async () => {
    const intersect = environment(true)
    localStorage.setItem(KEY, JSON.stringify(SEED))
    const user = userEvent.setup(), view = render(<App />)
    const idea = screen.getByRole('textbox', { name: 'Research draft' })
    const metadata = view.container.querySelector<HTMLInputElement>('#source-title')!
    await user.type(metadata, 'Keep source metadata')
    await user.type(idea, 'Keep the main idea')
    intersect(view.container.querySelector('[data-main-glass] [data-glass-layer]')!)
    await screen.findByTestId('main-glass-gpu-boundary')
    const layer = view.container.querySelector('[data-main-glass] [data-glass-layer]')!
    const callbacks = vi.mocked(GlassPanelCanvas).mock.calls.at(-1)![0]
    act(() => callbacks.onReady?.())
    act(() => callbacks.onUnavailable?.())
    expect(layer).toHaveAttribute('data-glass-state', 'unavailable')
    expect(screen.queryByTestId('main-glass-gpu-boundary')).not.toBeInTheDocument()
    act(() => callbacks.onReady?.())
    expect(layer).toHaveAttribute('data-glass-state', 'unavailable')
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toBe(idea)
    expect(idea).toHaveValue('Keep the main idea')
    expect(idea).toHaveFocus()
    expect(metadata).toHaveValue('Keep source metadata')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(SEED)
  })

  it('toggles the reusable panel GPU layer while retaining its multiline draft node and focus', async () => {
    const intersect = environment(true)
    const user = userEvent.setup()
    const view = render(<ResearchDraftPanel />)
    intersect(view.container.querySelector('[data-glass-layer]')!)
    const firstCanvas = await screen.findByTestId('main-glass-gpu-boundary')
    const draft = screen.getByRole('textbox', { name: 'Research draft' })
    await user.type(draft, 'First line{Enter}Second line')
    expect(draft).toHaveValue('First line\nSecond line')
    view.rerender(<ResearchDraftPanel mounted={false} />)
    expect(screen.queryByTestId('main-glass-gpu-boundary')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toBe(draft)
    expect(draft).toHaveFocus()
    view.rerender(<ResearchDraftPanel mounted />)
    intersect(view.container.querySelector('[data-glass-layer]')!)
    const secondCanvas = await screen.findByTestId('main-glass-gpu-boundary')
    expect(secondCanvas).not.toBe(firstCanvas)
    expect(screen.getByRole('textbox', { name: 'Research draft' })).toBe(draft)
    expect(draft).toHaveValue('First line\nSecond line')
    expect(draft).toHaveFocus()
    expect(localStorage.length).toBe(0)
  })
})
