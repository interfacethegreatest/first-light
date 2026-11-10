import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import HtmlGlassCanvas from '../src/components/html-glass-card/HtmlGlassCanvas'

vi.mock('../src/components/html-glass-card/HtmlGlassCanvas', () => ({ default: vi.fn() }))
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

beforeEach(() => { vi.mocked(HtmlGlassCanvas).mockImplementation(() => <div data-testid="main-html-gpu-boundary" />) })
afterEach(() => { vi.unstubAllGlobals() })

describe('glass card on the actual main workspace', () => {
  it('places one accessible customized card after the workspace and before the next step', () => {
    environment()
    const view = render(<App />)
    const section = screen.getByRole('region', { name: 'Idea draft' })
    expect(section).toHaveAttribute('id', 'glass-workspace')
    expect(section).toHaveAttribute('data-main-glass', '')
    expect(within(section).getAllByRole('heading', { name: 'A little more depth.', level: 2 })).toHaveLength(1)
    expect(within(section).getByRole('group', { name: 'A little more depth.' })).toBeInTheDocument()
    expect(within(section).getByRole('textbox', { name: 'Idea draft' }).closest('[aria-hidden="true"]')).toBeNull()
    expect(within(section).getByText('Use this temporary space to sketch the next idea you want to explore.')).toBeInTheDocument()
    expect(within(section).getByText('Temporary draft · Clears on reload')).toBeInTheDocument()
    const workspace = view.container.querySelector('.workspace-grid')!, next = view.container.querySelector('.next-step')!
    expect(workspace.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(section.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the idea draft independent of saved workspace and existing source/decision actions', async () => {
    environment();localStorage.setItem(KEY, JSON.stringify(SEED))
    const user = userEvent.setup(), view = render(<App />)
    const idea = screen.getByRole('textbox', { name: 'Idea draft' })
    await user.type(idea, 'Private temporary idea')
    const sourceTitle = view.container.querySelector<HTMLInputElement>('#source-title')!
    await user.type(sourceTitle, 'Unsaved metadata draft')
    const add = screen.getByRole('button', { name: 'Add source' })
    await user.click(add);await user.keyboard('{Enter}')
    expect(view.container.querySelectorAll('#source-sections [data-new-user-card]')).toHaveLength(2)
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
    expect(screen.getByRole('textbox', { name: 'Idea draft' })).toBe(idea)
    expect(idea).toHaveValue('Private temporary idea')
  })

  it('preserves both native draft areas and saved data when the new card renderer fails', async () => {
    const visible = environment(true);localStorage.setItem(KEY, JSON.stringify(SEED))
    const user = userEvent.setup(), view = render(<App />)
    const idea = screen.getByRole('textbox', { name: 'Idea draft' })
    const metadata = view.container.querySelector<HTMLInputElement>('#source-title')!
    await user.type(metadata, 'Keep source metadata')
    await user.type(idea, 'Keep the main idea')
    const card = view.container.querySelector('[data-main-glass] [data-html-glass-card]')!
    visible(card)
    await screen.findByTestId('main-html-gpu-boundary')
    const callbacks = vi.mocked(HtmlGlassCanvas).mock.calls.at(-1)![0]
    act(() => callbacks.onReady())
    act(() => callbacks.onUnavailable())
    expect(card).toHaveAttribute('data-html-state', 'unavailable')
    expect(screen.getByRole('textbox', { name: 'Idea draft' })).toBe(idea)
    expect(idea).toHaveValue('Keep the main idea')
    expect(idea).toHaveFocus()
    expect(metadata).toHaveValue('Keep source metadata')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(SEED)
  })
})
