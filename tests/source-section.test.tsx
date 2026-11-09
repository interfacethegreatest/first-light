import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { sourceSectionTemplate } from '../src/components/sources/SourceSection'
import { STORAGE_KEY, createDecision, createSource, type Workspace } from '../src/workspace'

beforeEach(() => {
  // Use real Calendar components with the user's reduced-motion preference;
  // the tests need no renderer or animation mocks to exercise App's state.
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function savedWorkspace(): Workspace {
  const source = createSource({ title: 'Saved source', url: 'https://example.org/saved', notes: 'Saved notes' })
  const workspace: Workspace = { version: 1, sources: [source], decisions: [] }
  workspace.decisions.push({
    ...createDecision({ sourceId: source.id, finding: 'Saved finding', implementation: 'Saved plan' }, workspace),
    status: 'building',
  })
  return workspace
}

describe('Add source introduces session-only UI sections', () => {
  it('immediately creates one section from a blank form without validation or a research-record write', () => {
    render(<App />)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const addSource = screen.getByRole('button', { name: 'Add source' })

    expect(addSource).toHaveAttribute('type', 'button')
    expect(screen.queryByRole('region', { name: 'Source section 1' })).not.toBeInTheDocument()
    fireEvent.click(addSource)

    const section = screen.getByRole('region', { name: 'Source section 1' })
    expect(within(section).getByText('New outputs will appear here.')).toBeInTheDocument()
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
    expect(write).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Source title' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Source URL' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Add decision' })).toBeDisabled()
    expect(document.getElementById(addSource.getAttribute('aria-controls')!)).toContainElement(section)
  })

  it('creates distinct, stable regions for repeated mouse and keyboard activations', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Add source' })

    await user.click(button)
    const firstSection = screen.getByRole('region', { name: 'Source section 1' })
    await user.click(button)
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    const sections = screen.getAllByRole('region', { name: /^Source section \d+$/ })
    expect(sections).toHaveLength(4)
    expect(sections[0]).toBe(firstSection)
    const headingIds = sections.map(section => section.getAttribute('aria-labelledby'))
    expect(new Set(headingIds).size).toBe(4)
    for (let index = 0; index < sections.length; index++) {
      expect(within(sections[index]).getByRole('heading', { name: `Source section ${index + 1}` })).toHaveAttribute('id', headingIds[index])
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('preserves source and decision drafts and all previously saved workspace data', async () => {
    const workspace = savedWorkspace()
    const saved = JSON.stringify(workspace)
    localStorage.setItem(STORAGE_KEY, saved)
    const user = userEvent.setup()
    render(<App />)
    const title = screen.getByRole('textbox', { name: 'Source title' })
    const url = screen.getByRole('textbox', { name: 'Source URL' })
    const notes = screen.getByRole('textbox', { name: /Source notes/ })
    const finding = screen.getByRole('textbox', { name: 'Research finding' })
    const implementation = screen.getByRole('textbox', { name: 'Implementation plan' })
    await user.type(title, 'Unsaved draft')
    await user.type(url, 'not a valid research URL')
    await user.type(notes, 'Draft notes')
    await user.type(finding, 'Draft finding')
    await user.type(implementation, 'Draft implementation')
    const write = vi.spyOn(Storage.prototype, 'setItem')

    await user.click(screen.getByRole('button', { name: 'Add source' }))

    expect(screen.getByRole('region', { name: 'Source section 1' })).toBeInTheDocument()
    expect(title).toHaveValue('Unsaved draft')
    expect(url).toHaveValue('not a valid research URL')
    expect(notes).toHaveValue('Draft notes')
    expect(finding).toHaveValue('Draft finding')
    expect(implementation).toHaveValue('Draft implementation')
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
    expect(write).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved)
    expect(within(screen.getByRole('region', { name: 'Research library' })).getByRole('link', { name: 'Saved source' })).toHaveAttribute('href', workspace.sources[0].url)
    expect(screen.getByRole('combobox', { name: 'Status for decision 1' })).toHaveValue('building')
  })

  it('does not persist UI sections across a fresh App mount', async () => {
    const saved = JSON.stringify(savedWorkspace())
    localStorage.setItem(STORAGE_KEY, saved)
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Add source' }))
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBeInTheDocument()

    first.unmount()
    render(<App />)

    expect(screen.queryByRole('region', { name: /^Source section \d+$/ })).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved)
    expect(within(screen.getByRole('region', { name: 'Research library' })).getByRole('link', { name: 'Saved source' })).toBeInTheDocument()
  })
})

describe('reusable source section template', () => {
  it('creates independent instances whose child state does not leak between sections', async () => {
    const first = sourceSectionTemplate.create()
    const second = sourceSectionTemplate.create()
    expect(first.id).not.toBe(second.id)
    const user = userEvent.setup()
    render(<>
      {sourceSectionTemplate.render(first, 1, <label>Output draft<input /></label>)}
      {sourceSectionTemplate.render(second, 2, <label>Output draft<input /></label>)}
    </>)
    const firstField = within(screen.getByRole('region', { name: 'Source section 1' })).getByRole('textbox', { name: 'Output draft' })
    const secondField = within(screen.getByRole('region', { name: 'Source section 2' })).getByRole('textbox', { name: 'Output draft' })

    await user.type(firstField, 'First output')
    await user.type(secondField, 'Second output')

    expect(firstField).toHaveValue('First output')
    expect(secondField).toHaveValue('Second output')
  })

  it('accepts changing React output without replacing its section, focused child, or natural-height contract', async () => {
    const section = sourceSectionTemplate.create()
    const output = (expanded: boolean) => <>
      <label>Editable output<input defaultValue="Draft output" /></label>
      {expanded ? <div><p>Expanded result one.</p><p>Expanded result two.</p><p>Expanded result three.</p></div> : <p>Short result.</p>}
    </>
    const view = render(sourceSectionTemplate.render(section, 1, output(false)))
    const region = screen.getByRole('region', { name: 'Source section 1' })
    const headingId = region.getAttribute('aria-labelledby')
    const field = within(region).getByRole('textbox', { name: 'Editable output' })
    const user = userEvent.setup()
    await user.click(field)

    view.rerender(sourceSectionTemplate.render(section, 1, output(true)))
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(region)
    expect(within(region).getByText('Expanded result three.')).toBeInTheDocument()
    expect(within(region).queryByText('Short result.')).not.toBeInTheDocument()
    expect(within(region).getByRole('textbox', { name: 'Editable output' })).toBe(field)
    expect(field).toHaveFocus()

    view.rerender(sourceSectionTemplate.render(section, 1, output(false)))
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(region)
    expect(region).toHaveAttribute('aria-labelledby', headingId)
    expect(within(region).getByText('Short result.')).toBeInTheDocument()
    expect(within(region).queryByText('Expanded result three.')).not.toBeInTheDocument()
    expect(field).toHaveValue('Draft output')
    expect(field).toHaveFocus()
    // jsdom has no layout engine: assert the absence of fixed-height constraints,
    // and leave actual height/width growth and overflow to browser verification.
    expect(region.style.height).toBe('auto')
    expect(region.style.maxHeight).toBe('')
    expect(region.style.width).toBe('100%')
  })
})
