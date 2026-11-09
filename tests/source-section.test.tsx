import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import AddSourceButton from '../src/components/sources/AddSourceButton'
import SourceSections from '../src/components/sources/SourceSections'
import useSourceSections from '../src/components/sources/useSourceSections'
import { sourceSectionTemplate } from '../src/components/sources/sourceSectionTemplate'
import { STORAGE_KEY, createDecision, createSource, type Workspace } from '../src/workspace'

// The source card now mounts Canvas directly; isolate only that GPU boundary.
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: () => null }))

beforeEach(() => {
  // Calendar controls and all source-feature state remain real.
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

describe('standalone source section feature', () => {
  it('works under StrictMode without App or storage and preserves native actions, custom linkage, and stable paragraphs', async () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable') })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable') })
    const submitted = vi.fn()
    const invalid = vi.fn()
    function StandaloneFeature({ unrelatedText }: { unrelatedText: string }) {
      const { sourceSections, introduceSourceSection } = useSourceSections()
      return <>
        <form onSubmit={event => { event.preventDefault(); submitted() }} onInvalid={invalid}>
          <label>Required draft<input required /></label>
          <AddSourceButton onClick={introduceSourceSection} sectionsId="independent-source-sections" />
        </form>
        <p>{unrelatedText}</p>
        <SourceSections sections={sourceSections} id="independent-source-sections" />
      </>
    }
    const user = userEvent.setup()
    const view = render(<StrictMode><StandaloneFeature unrelatedText="Initial unrelated content" /></StrictMode>)
    const button = screen.getByRole('button', { name: 'Add source' })
    expect(screen.getByRole('textbox', { name: 'Required draft' })).toBeRequired()
    expect(button).toHaveAttribute('type', 'button')
    expect(screen.queryByRole('region', { name: /^Source section \d+$/ })).not.toBeInTheDocument()

    await user.click(button)
    expect(screen.getAllByRole('region', { name: /^Source section \d+$/ })).toHaveLength(1)
    await user.keyboard('{Enter}')
    expect(screen.getAllByRole('region', { name: /^Source section \d+$/ })).toHaveLength(2)
    await user.keyboard(' ')
    const regions = screen.getAllByRole('region', { name: /^Source section \d+$/ })
    expect(regions).toHaveLength(3)
    expect(new Set(regions.map(region => region.getAttribute('aria-labelledby'))).size).toBe(3)
    const paragraphs = regions.map(region => region.querySelector('p')!)
    const text = paragraphs.map(paragraph => paragraph.textContent)
    expect(new Set(text.map(value => value!.length)).size).toBe(3)
    const container = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(container.id).toBe('independent-source-sections')
    for (const region of regions) expect(container).toContainElement(region)

    view.rerender(<StrictMode><StandaloneFeature unrelatedText="Changed unrelated content" /></StrictMode>)
    expect(screen.getByText('Changed unrelated content')).toBeInTheDocument()
    for (let index = 0; index < regions.length; index++) {
      const region = screen.getByRole('region', { name: `Source section ${index + 1}` })
      expect(region).toBe(regions[index])
      expect(region.querySelector('p')).toBe(paragraphs[index])
      expect(paragraphs[index].textContent).toBe(text[index])
    }
    expect(screen.getByRole('textbox', { name: 'Required draft' })).toHaveValue('')
    expect(submitted).not.toHaveBeenCalled()
    expect(invalid).not.toHaveBeenCalled()
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })

  it('keeps batched additions and hook instances independent under StrictMode', () => {
    const first = renderHook(() => useSourceSections(), { wrapper: StrictMode })
    const second = renderHook(() => useSourceSections(), { wrapper: StrictMode })
    act(() => {
      first.result.current.introduceSourceSection()
      first.result.current.introduceSourceSection()
    })

    expect(first.result.current.sourceSections).toHaveLength(2)
    expect(new Set(first.result.current.sourceSections.map(section => section.id)).size).toBe(2)
    expect(second.result.current.sourceSections).toHaveLength(0)
    const previous = first.result.current.sourceSections
    first.rerender()
    expect(first.result.current.sourceSections).toEqual(previous)
    first.unmount()
    const fresh = renderHook(() => useSourceSections(), { wrapper: StrictMode })
    expect(fresh.result.current.sourceSections).toHaveLength(0)
  })
})

describe('Add source introduces session-only UI sections', () => {
  it('immediately creates one section from a blank form without validation or a research-record write', () => {
    render(<App />)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const addSource = screen.getByRole('button', { name: 'Add source' })

    expect(addSource).toHaveAttribute('type', 'button')
    expect(screen.queryByRole('region', { name: 'Source section 1' })).not.toBeInTheDocument()
    fireEvent.click(addSource)

    const section = screen.getByRole('region', { name: 'Source section 1' })
    const body = section.lastElementChild!
    expect(body.children).toHaveLength(1)
    expect(body.firstElementChild?.tagName).toBe('P')
    expect(body.firstElementChild?.textContent).toMatch(/^Lorem ipsum /)
    expect(body.firstElementChild?.children).toHaveLength(0)
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
    const firstThreeLengths = sections.slice(0, 3).map(section => section.querySelector('p')!.textContent!.length)
    expect(new Set(firstThreeLengths).size).toBe(3)
    const headingIds = sections.map(section => section.getAttribute('aria-labelledby'))
    expect(new Set(headingIds).size).toBe(4)
    for (let index = 0; index < sections.length; index++) {
      expect(within(sections[index]).getByRole('heading', { name: `Source section ${index + 1}` })).toHaveAttribute('id', headingIds[index])
    }
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps each ipsum paragraph stable when unrelated App state rerenders', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'Add source' })
    for (let index = 0; index < 3; index++) await user.click(button)
    const regions = screen.getAllByRole('region', { name: /^Source section \d+$/ })
    const paragraphs = regions.map(region => region.querySelector('p')!)
    const text = paragraphs.map(paragraph => paragraph.textContent)

    await user.type(screen.getByRole('textbox', { name: 'Source title' }), 'Unrelated source draft')
    await user.type(screen.getByRole('textbox', { name: /Source notes/ }), 'Unrelated notes')
    await user.click(button)

    for (let index = 0; index < regions.length; index++) {
      const region = screen.getByRole('region', { name: `Source section ${index + 1}` })
      expect(region).toBe(regions[index])
      expect(region.querySelector('p')).toBe(paragraphs[index])
      expect(paragraphs[index].textContent).toBe(text[index])
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
  it('gives every consecutive trio distinct text lengths regardless of the cycle starting point', () => {
    for (let offset = 0; offset < 3; offset++) {
      for (let skip = 0; skip < offset; skip++) sourceSectionTemplate.create()
      const instances = Array.from({ length: 3 }, () => sourceSectionTemplate.create())
      expect(new Set(instances.map(instance => instance.id)).size).toBe(3)
      expect(instances.every(instance => typeof instance.text === 'string' && instance.text.startsWith('Lorem ipsum '))).toBe(true)
      expect(new Set(instances.map(instance => instance.text!.length)).size).toBe(3)
    }
  })

  it('renders stored text directly in one body paragraph without parsing markup', () => {
    const text = 'Lorem <strong>ipsum</strong> & <script>example()</script>.'
    render(sourceSectionTemplate.render({ id: 'literal-text', text }, 1))
    const region = screen.getByRole('region', { name: 'Source section 1' })
    const body = region.lastElementChild!

    expect(body.children).toHaveLength(1)
    const paragraph = body.firstElementChild!
    expect(paragraph.tagName).toBe('P')
    expect(paragraph.textContent).toBe(text)
    expect(paragraph.children).toHaveLength(0)
    expect(region.querySelector('strong,script')).toBeNull()
  })

  it('keeps optional title-row controls native and accessible without inserting actions into the body', async () => {
    const instance = sourceSectionTemplate.create()
    const edit = vi.fn()
    const expand = vi.fn()
    const user = userEvent.setup()
    render(sourceSectionTemplate.render(instance, 1, undefined, <>
      <button type="button" onClick={edit}>Edit section</button>
      <button type="button" onClick={expand}>Expand section</button>
    </>))
    const region = screen.getByRole('region', { name: 'Source section 1' })
    const heading = within(region).getByRole('heading', { name: 'Source section 1' })
    const editButton = within(region).getByRole('button', { name: 'Edit section' })
    const expandButton = within(region).getByRole('button', { name: 'Expand section' })

    expect(heading.parentElement).toContainElement(editButton)
    expect(heading.parentElement).toContainElement(expandButton)
    expect(region.lastElementChild?.querySelector('button')).toBeNull()
    await user.click(editButton)
    expect(edit).toHaveBeenCalledOnce()
    await user.keyboard(' ')
    expect(edit).toHaveBeenCalledTimes(2)
    await user.tab()
    expect(expandButton).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(expand).toHaveBeenCalledOnce()
    expect(region.querySelector('p')?.textContent).toBe(instance.text)
  })

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
    expect(screen.queryByText(/^Lorem ipsum /)).not.toBeInTheDocument()

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
