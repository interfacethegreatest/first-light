import { StrictMode, useState } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import AddSourceButton from '../src/components/sources/AddSourceButton'
import SourceSections from '../src/components/sources/SourceSections'
import SourceSectionMenu from '../src/components/sources/SourceSectionMenu'
import useSourceSections from '../src/components/sources/useSourceSections'
import { STORAGE_KEY, createDecision, createSource, type Workspace } from '../src/workspace'

const lifecycle = vi.hoisted(() => ({ removed: [] as string[] }))
// Replace only the renderer boundary; real card ownership/effects still unmount.
vi.mock('../src/components/react three fibre/sunScene/SunScene', async () => {
  const { useEffect, useRef } = await import('react')
  return { default: function OwnedRenderer() {
    const node = useRef<HTMLDivElement>(null)
    useEffect(() => {
      const owner = node.current!.closest('section')!.getAttribute('aria-labelledby')!
      return () => { lifecycle.removed.push(owner) }
    }, [])
    return <div ref={node} data-testid="owned-renderer" />
  } }
})

beforeEach(() => {
  lifecycle.removed.length = 0
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(),
  })))
  vi.stubGlobal('ResizeObserver', undefined)
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
    disconnect() {}
    unobserve() {}
  })
})
afterEach(() => { vi.unstubAllGlobals() })

function trigger() { return screen.getByRole('button', { name: 'More options for Research library' }) }
function dismiss() { return screen.getByRole('menuitem', { name: 'Not interested in this post' }) }
function MenuFixture() {
  const [open, setOpen] = useState(false)
  return <form aria-label="Menu fixture" onSubmit={event => event.preventDefault()}>
    <label>Native draft<input required /></label>
    <SourceSectionMenu sectionId="research-library" label="Research library" open={open} onOpenChange={setOpen} onDismiss={() => setOpen(false)} />
    <button type="button">Outside action</button>
  </form>
}
function CardsFixture() {
  const { sourceSections, introduceSourceSection } = useSourceSections()
  return <><AddSourceButton onClick={introduceSourceSection} /><SourceSections sections={sourceSections} /></>
}

describe('Research library panel menu', () => {
  it('offers the same single action and two blank disabled rows with keyboard/outside dismissal and no submit', async () => {
    const user = userEvent.setup()
    const view = render(<MenuFixture />)
    const submit = vi.fn(), invalid = vi.fn()
    view.container.querySelector('form')!.addEventListener('submit', submit)
    view.container.querySelector('input')!.addEventListener('invalid', invalid)
    const button = trigger()
    expect(button).toHaveAttribute('type', 'button')
    act(() => button.focus())
    await user.keyboard('{ArrowDown}')
    const menu = screen.getByRole('menu')
    expect(menu.parentElement).toBe(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls', menu.id)
    expect(dismiss()).toHaveFocus()
    const rows = Array.from(menu.querySelectorAll('button'))
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent(/^Not interested in this post$/)
    for (const row of rows) expect(row).toHaveAttribute('type', 'button')
    for (const row of rows.slice(1)) {
      expect(row).toBeDisabled()
      expect(row.textContent).toBe('')
      expect(row).toHaveAttribute('aria-hidden', 'true')
      expect(row).toHaveAttribute('tabindex', '-1')
      expect(row.children).toHaveLength(0)
      await user.click(row)
    }
    expect(within(menu).getAllByRole('menuitem')).toEqual([rows[0]])
    act(() => rows[0].focus()) // Native disabled rows can blur the current item.
    await user.keyboard('{End}{ArrowUp}{Home}')
    expect(dismiss()).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(button).toHaveFocus()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    await user.tab()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.activeElement).not.toBe(button)
    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Outside action' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(button)
    act(() => screen.getByRole('textbox', { name: 'Native draft' }).focus())
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
    expect(invalid).not.toHaveBeenCalled()
  })

  it('restores generated cards and subsequent three-card batches without any menu controls', async () => {
    const user = userEvent.setup()
    render(<CardsFixture />)
    await user.click(screen.getByRole('button', { name: 'Add source' }))
    const originals = screen.getAllByRole('region', { name: /^Source section \d+$/ })
    const paragraphs = originals.map(section => section.querySelector('p')!.textContent)
    const tones = originals.map(section => section.getAttribute('data-border-tone'))
    expect(originals).toHaveLength(3)
    expect(originals.every(section => !section.querySelector('button'))).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Add source' }))
    const all = screen.getAllByRole('region', { name: /^Source section \d+$/ })
    expect(all.map(section => section.querySelector('h3')!.textContent)).toEqual([
      'Source section 1', 'Source section 2', 'Source section 3',
      'Source section 4', 'Source section 5', 'Source section 6',
    ])
    expect(all.slice(0, 3)).toEqual(originals)
    expect(all.slice(0, 3).map(section => section.querySelector('p')!.textContent)).toEqual(paragraphs)
    expect(all.slice(0, 3).map(section => section.getAttribute('data-border-tone'))).toEqual(tones)
    expect(all.every(section => !section.querySelector('button'))).toBe(true)
    expect(screen.queryByRole('button', { name: /^More options/ })).not.toBeInTheDocument()
  })

  it('removes all open-only listeners and the portal on close or owner unmount', async () => {
    const user = userEvent.setup()
    const view = render(<MenuFixture />)
    const da = vi.spyOn(document, 'addEventListener'), dr = vi.spyOn(document, 'removeEventListener')
    const wa = vi.spyOn(window, 'addEventListener'), wr = vi.spyOn(window, 'removeEventListener')
    const ownedDoc = new Set(['pointerdown', 'focusin', 'keydown'])
    expect(da.mock.calls.filter(x => ownedDoc.has(x[0]))).toHaveLength(0)
    await user.click(trigger())
    const docCalls = da.mock.calls.filter(x => ownedDoc.has(x[0])), winCalls = wa.mock.calls.filter(x => ['scroll', 'resize'].includes(x[0]))
    expect(docCalls).toHaveLength(3);expect(winCalls).toHaveLength(2)
    expect(screen.getAllByRole('menu')).toHaveLength(1)
    fireEvent.resize(window)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    for (const call of docCalls) expect(dr.mock.calls).toContainEqual(call)
    for (const call of winCalls) expect(wr.mock.calls).toContainEqual(call)
    da.mockClear();wa.mockClear();dr.mockClear();wr.mockClear()
    await user.click(trigger())
    const docUnmount = da.mock.calls.filter(x => ownedDoc.has(x[0])), winUnmount = wa.mock.calls.filter(x => ['scroll', 'resize'].includes(x[0]))
    view.unmount()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    for (const call of docUnmount) expect(dr.mock.calls).toContainEqual(call)
    for (const call of winUnmount) expect(wr.mock.calls).toContainEqual(call)
  })

  it('unmounts only the Research library CalendarPanel and descendants, preserving saved data and all surviving native state', async () => {
    const saved = createSource({ title: 'Retained evidence', url: 'https://example.org/research', notes: 'Original notes' })
    const workspace: Workspace = { version: 1, sources: [saved], decisions: [] }
    workspace.decisions.push(createDecision({ sourceId: saved.id, finding: 'Retained finding', implementation: 'Retained implementation' }, workspace))
    const raw = JSON.stringify(workspace);localStorage.setItem(STORAGE_KEY, raw)
    const user = userEvent.setup();render(<StrictMode><App /></StrictMode>)
    const sourceTitle = screen.getByRole('textbox', { name: 'Source title' })
    const finding = screen.getByRole('textbox', { name: 'Research finding' })
    const plan = screen.getByRole('textbox', { name: 'Implementation plan' })
    const decision = screen.getByRole('heading', { name: 'From finding to feature' }).closest('section')!
    const decisionWrapper = decision.closest('.calendar-panel-entrance')!
    const overview = screen.getByRole('region', { name: 'Workspace overview' })
    const overviewText = overview.textContent
    const otherRoots = ['#glass-workspace', '#glass-objects', '.site-footer', '.hero'].map(selector => document.querySelector(selector))
    await user.type(sourceTitle, 'Unsubmitted source draft')
    await user.type(finding, 'Unsubmitted finding')
    await user.type(plan, 'Unsubmitted implementation')
    const write = vi.spyOn(Storage.prototype, 'setItem'), submit = vi.fn(), invalid = vi.fn()
    document.querySelectorAll('form').forEach(form => form.addEventListener('submit', submit))
    document.querySelectorAll('input[required]').forEach(input => input.addEventListener('invalid', invalid))
    await user.click(screen.getByRole('button', { name: 'Add source' }))
    await user.click(screen.getByRole('button', { name: 'Add source' }))
    await waitFor(() => expect(screen.getAllByTestId('owned-renderer')).toHaveLength(6))
    const library = screen.getByRole('heading', { name: 'Research library' }).closest('section')!
    const libraryWrapper = library.closest('.calendar-panel-entrance')!
    const cards = within(library).getAllByRole('region', { name: /^Source section \d+$/ })
    const cardWrappers = cards.map(card => card.closest('[data-source-reveal]')!)
    const rendererOwners = cards.map(card => card.getAttribute('aria-labelledby')!)
    expect(within(library).getAllByRole('button', { name: /^More options/ })).toEqual([trigger()])
    expect(cards.every(card => !card.querySelector('button'))).toBe(true)
    lifecycle.removed.length = 0 // Exclude StrictMode's intentional effect replay.
    await user.click(trigger())
    await user.keyboard('{Escape}')
    expect(sourceTitle).toHaveValue('Unsubmitted source draft')
    expect(screen.getByRole('textbox', { name: 'Source title' })).toBe(sourceTitle)
    expect(library.isConnected).toBe(true)
    await user.click(trigger())
    await user.click(dismiss())
    expect(screen.queryByRole('heading', { name: 'Research library' })).not.toBeInTheDocument()
    expect(libraryWrapper.isConnected).toBe(false)
    expect(library.isConnected).toBe(false)
    expect(cardWrappers.every(wrapper => !wrapper.isConnected)).toBe(true)
    expect(screen.queryAllByTestId('owned-renderer')).toHaveLength(0)
    expect(lifecycle.removed.sort()).toEqual(rendererOwners.sort())
    expect(document.getElementById('source-sections')).toBeNull()
    expect(document.querySelectorAll('.workspace-grid > .calendar-panel-entrance')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'From finding to feature' }).closest('section')).toBe(decision)
    expect(decision.closest('.calendar-panel-entrance')).toBe(decisionWrapper)
    expect(screen.getByRole('textbox', { name: 'Research finding' })).toBe(finding)
    expect(finding).toHaveValue('Unsubmitted finding');expect(finding).toHaveFocus()
    expect(plan).toHaveValue('Unsubmitted implementation')
    expect(overview.textContent).toBe(overviewText)
    expect(['#glass-workspace', '#glass-objects', '.site-footer', '.hero'].map(selector => document.querySelector(selector))).toEqual(otherRoots)
    expect(screen.getByText('Retained finding')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);expect(write).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled();expect(invalid).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })
})
