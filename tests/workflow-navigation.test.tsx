import { StrictMode, useState } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import WorkflowStep from '../src/components/workflow/WorkflowStep'
import { STORAGE_KEY } from '../src/workspace'

vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas', () => ({ default: () => null }))
vi.mock('../src/components/typography/FooterTextCanvas', () => ({ default: () => null }))
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: () => null }))

let reduced = false
const scroll = vi.fn()
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')

beforeEach(() => {
  scroll.mockClear()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, writable: true, value: scroll })
  reduced = false
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })))
  vi.stubGlobal('WebGLRenderingContext', undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  vi.stubGlobal('ResizeObserver', undefined)
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
    disconnect() {}
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll)
  else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
})

function frameQueue() {
  let serial = 0
  const queue = new Map<number, FrameRequestCallback>()
  const cancel = vi.fn((id: number) => { queue.delete(id) })
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { queue.set(++serial, callback); return serial }))
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return {
    queue, cancel,
    flush() { act(() => { const frames = [...queue.values()]; queue.clear(); frames.forEach(frame => frame(16)) }) },
  }
}

function Fixture({ target = true }: { target?: boolean }) {
  const [draft, setDraft] = useState('')
  return <form aria-label="Navigation fixture" onSubmit={event => event.preventDefault()}>
    <WorkflowStep step="01" label="Collect sources" targetId="test-library" beforeNavigate={() => {}} />
    {target && <section id="test-library" tabIndex={-1} aria-label="Fixture library">
      <label>Draft<input value={draft} onChange={event => setDraft(event.target.value)} /></label>
    </section>}
  </form>
}

describe('workflow navigation', () => {
  it('uses a native button for mouse, Enter and Space without submitting or rewriting drafts', async () => {
    const frames = frameQueue(), user = userEvent.setup()
    const view = render(<Fixture />), submit = vi.fn()
    view.container.querySelector('form')!.addEventListener('submit', submit)
    const button = screen.getByRole('button', { name: '01 Collect sources' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button.parentElement?.tagName).toBe('SPAN')
    expect(button).toHaveAttribute('aria-controls', 'test-library')
    await user.click(button);frames.flush()
    const target = screen.getByRole('region', { name: 'Fixture library' })
    expect(target).toHaveFocus()
    expect(scroll).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveFocus()
    await user.type(screen.getByRole('textbox'), 'Keep this draft')
    expect(scroll).toHaveBeenCalledTimes(1) // Includes the fresh inline callback from Fixture's rerender.
    act(() => button.focus());await user.keyboard('{Enter}');frames.flush()
    act(() => button.focus());await user.keyboard(' ');frames.flush()
    expect(scroll).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('textbox')).toHaveValue('Keep this draft')
    expect(submit).not.toHaveBeenCalled()
  })

  it('reads the current reduced-motion preference when the requested frame executes', () => {
    const frames = frameQueue()
    render(<Fixture />)
    fireEvent.click(screen.getByRole('button'))
    reduced = true
    frames.flush()
    expect(scroll).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start', inline: 'nearest' })
    reduced = false
    fireEvent.click(screen.getByRole('button'));frames.flush()
    expect(scroll).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start', inline: 'nearest' })
  })

  it('coalesces replaced requests and cancels pending work on unmount under StrictMode', () => {
    const frames = frameQueue()
    const view = render(<StrictMode><Fixture /></StrictMode>)
    expect(frames.queue.size).toBe(0)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(frames.queue.size).toBe(1)
    expect(frames.cancel).toHaveBeenCalled()
    frames.flush()
    expect(scroll).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button'))
    expect(frames.queue.size).toBe(1)
    view.unmount()
    expect(frames.queue.size).toBe(0)
    frames.flush()
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('does nothing for missing or detached targets and can navigate again once a target exists', () => {
    const frames = frameQueue(), view = render(<Fixture target={false} />)
    fireEvent.click(screen.getByRole('button'));frames.flush()
    expect(scroll).not.toHaveBeenCalled()
    view.rerender(<Fixture />)
    fireEvent.click(screen.getByRole('button'))
    view.rerender(<Fixture target={false} />)
    frames.flush()
    expect(scroll).not.toHaveBeenCalled()
    view.rerender(<Fixture />)
    fireEvent.click(screen.getByRole('button'));frames.flush()
    expect(screen.getByRole('region')).toHaveFocus()
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('restores the dismissed App library before scrolling and preserves drafts, generated content and surviving nodes', async () => {
    reduced = true
    const saved = { version: 1, sources: [{ id: 'kept-source', title: 'Saved evidence', url: 'https://example.org/evidence', notes: 'Retained notes', createdAt: '2026-11-11T00:00:00.000Z' }], decisions: [] }
    const raw = JSON.stringify(saved);localStorage.setItem(STORAGE_KEY, raw)
    const user = userEvent.setup();render(<StrictMode><App /></StrictMode>)
    const library = screen.getByRole('region', { name: 'Research library' })
    const title = screen.getByRole('textbox', { name: 'Source title' })
    const notes = screen.getByRole('textbox', { name: /Source notes/ })
    const finding = screen.getByRole('textbox', { name: 'Research finding' })
    const plan = screen.getByRole('textbox', { name: 'Implementation plan' })
    fireEvent.change(title, { target: { value: 'Unsubmitted title' } })
    fireEvent.change(notes, { target: { value: 'Unsubmitted notes' } })
    fireEvent.change(finding, { target: { value: 'Keep finding' } })
    fireEvent.change(plan, { target: { value: 'Keep implementation' } })
    await user.click(screen.getByRole('button', { name: 'Add source' }))
    const cards = screen.getAllByRole('region', { name: /^Source section/ })
    const headings = cards.map(card => card.querySelector('h3')!.id)
    const contents = cards.map(card => card.querySelector('p')!.textContent)
    const otherRoots = ['.decision-panel', '#glass-workspace', '#glass-objects', '.site-footer'].map(selector => document.querySelector(selector))
    const nav = screen.getByRole('button', { name: '01 Collect sources' })
    const submit = vi.fn(), invalid = vi.fn(), write = vi.spyOn(Storage.prototype, 'setItem')
    document.querySelectorAll('form').forEach(form => form.addEventListener('submit', submit))
    title.addEventListener('invalid', invalid)
    await user.click(nav)
    await waitFor(() => expect(library).toHaveFocus())
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
    fireEvent.change(title, { target: { value: 'Edited source title' } })
    expect(scroll).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'More options for Research library' }))
    await user.click(screen.getByRole('menuitem', { name: 'Not interested in this post' }))
    expect(library.isConnected).toBe(false)
    expect(screen.queryByRole('region', { name: 'Research library' })).toBeNull()
    await user.click(nav)
    const restored = await screen.findByRole('region', { name: 'Research library' })
    await waitFor(() => expect(restored).toHaveFocus())
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(2))
    expect(scroll.mock.contexts.at(-1)).toBe(restored)
    expect(scroll).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start', inline: 'nearest' })
    expect(screen.getByRole('textbox', { name: 'Source title' })).toHaveValue('Edited source title')
    expect(screen.getByRole('textbox', { name: /Source notes/ })).toHaveValue('Unsubmitted notes')
    const restoredCards = within(restored).getAllByRole('region', { name: /^Source section/ })
    expect(restoredCards.map(card => card.querySelector('h3')!.id)).toEqual(headings)
    expect(restoredCards.map(card => card.querySelector('p')!.textContent)).toEqual(contents)
    expect(screen.getByRole('textbox', { name: 'Research finding' })).toBe(finding)
    expect(finding).toHaveValue('Keep finding');expect(plan).toHaveValue('Keep implementation')
    expect(['.decision-panel', '#glass-workspace', '#glass-objects', '.site-footer'].map(selector => document.querySelector(selector))).toEqual(otherRoots)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    expect(write).not.toHaveBeenCalled();expect(submit).not.toHaveBeenCalled();expect(invalid).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
  })
})
