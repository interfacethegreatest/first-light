import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import SourceSections from '../src/components/sources/SourceSections'
import type { SourceSectionInstance } from '../src/components/sources/SourceSection'

interface Playback { stop: ReturnType<typeof vi.fn>; complete(): void }
const heightPlayback = vi.hoisted(() => ({ runs: [] as Playback[] }))

// Only the parent playback clock/layout and GPU are controlled. Reveal variants,
// inherited child animations, source cards, and accessibility behavior stay real.
vi.mock('framer-motion', async importOriginal => ({
  ...await importOriginal<typeof import('framer-motion')>(),
  animate: vi.fn((_value: unknown, _target: number, options: { onComplete?: () => void }) => {
    const stop = vi.fn()
    heightPlayback.runs.push({ stop, complete: () => options.onComplete?.() })
    return { stop }
  }),
}))
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: () => <canvas data-testid="sun-boundary" /> }))

const first: SourceSectionInstance = { id: 'sequence-first', text: 'First sequence output.' }
const second: SourceSectionInstance = { id: 'sequence-second', text: 'Second sequence output.' }
const third: SourceSectionInstance = { id: 'sequence-third', text: 'Third sequence output.' }

function layout(initial: number, reducedMotion = false) {
  const state = { intrinsic: initial, current: undefined as number | undefined }
  const observers: Observer[] = []
  class Observer {
    disconnected = false
    observe = vi.fn()
    disconnect = vi.fn(() => { this.disconnected = true })
    constructor(readonly callback: ResizeObserverCallback) { observers.push(this) }
  }
  vi.stubGlobal('ResizeObserver', Observer)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.style.display === 'flow-root') return state.intrinsic
    return state.current ?? (this.style.height === 'auto' ? state.intrinsic : Number.parseFloat(this.style.height) || 0)
  })
  const listeners = new Set<() => void>()
  const reduced = {
    matches: reducedMotion,
    addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)),
    addListener: vi.fn(), removeListener: vi.fn(),
  }
  const coarse = { ...reduced, matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('prefers-reduced-motion') ? reduced : coarse))
  return {
    state,
    reduce(matches: boolean) {
      act(() => { reduced.matches = matches; listeners.forEach(listener => listener()) })
    },
    notify() {
      const observer = observers.filter(value => !value.disconnected).at(-1)!
      act(() => observer.callback([], observer as unknown as ResizeObserver))
    },
  }
}

function container() { return document.getElementById('sequence-sections')! }
function outer() { return container().parentElement!.parentElement! }
function card(text: string) { return screen.getByText(text).closest('section')! }
function reveal(node: HTMLElement) { return node.closest<HTMLElement>('[data-source-reveal]')! }
function finish(run = heightPlayback.runs.at(-1)!) { act(() => run.complete()) }

function expectPending(node: HTMLElement) {
  const wrapper = reveal(node)
  expect(wrapper).toHaveAttribute('data-source-reveal', 'waiting')
  expect(wrapper).toHaveAttribute('aria-hidden', 'true')
  expect(wrapper).toHaveAttribute('inert')
  expect(wrapper).toHaveStyle({ visibility: 'hidden' })
  expect(wrapper).not.toHaveStyle({ display: 'none' })
  expect(node.querySelector('canvas')).toBeInTheDocument()
}

beforeEach(() => { heightPlayback.runs.length = 0 })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('source reveal after parent settlement', () => {
  it('keeps measured pending cards inaccessible until final parent completion, then completes the real child reveal', async () => {
    const measured = layout(0)
    const view = render(<SourceSections sections={[]} id="sequence-sections" />)
    measured.state.intrinsic = 360
    view.rerender(<SourceSections sections={[first, second]} id="sequence-sections" />)
    const firstNode = card(first.text!)
    const secondNode = card(second.text!)
    expectPending(firstNode)
    expectPending(secondNode)
    expect(screen.queryByRole('region', { name: 'Source section 1' })).not.toBeInTheDocument()
    expect(outer().style.height).toBe('0px')

    finish()
    expect(outer().style.height).toBe('auto')
    expect(outer().style.overflow).toBe('visible')
    for (const node of [firstNode, secondNode]) {
      expect(reveal(node)).not.toHaveAttribute('inert')
      expect(reveal(node)).not.toHaveAttribute('aria-hidden')
      expect(reveal(node)).toHaveStyle({ visibility: 'visible' })
    }
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(firstNode)
    expect(screen.getByRole('region', { name: 'Source section 2' })).toBe(secondNode)
    await waitFor(() => {
      expect(reveal(firstNode)).toHaveAttribute('data-source-reveal', 'settled')
      expect(reveal(secondNode)).toHaveAttribute('data-source-reveal', 'settled')
    }, { timeout: 2500 })
    expect(card(first.text!)).toBe(firstNode)
  })

  it('does not reveal rapid additions on stale completion and never rehides previously present cards', () => {
    const measured = layout(180)
    const view = render(<SourceSections sections={[first]} id="sequence-sections" />)
    const existing = screen.getByRole('region', { name: 'Source section 1' })
    const sun = existing.querySelector('canvas')
    measured.state.intrinsic = 360
    view.rerender(<SourceSections sections={[first, second]} id="sequence-sections" />)
    const old = heightPlayback.runs.at(-1)!
    measured.state.current = 240
    measured.state.intrinsic = 540
    view.rerender(<SourceSections sections={[first, second, third]} id="sequence-sections" />)
    expect(old.stop).toHaveBeenCalledOnce()
    finish(old)

    expect(outer().style.height).toBe('240px')
    expectPending(card(second.text!))
    expectPending(card(third.text!))
    expect(reveal(existing)).toHaveAttribute('data-source-reveal', 'settled')
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(existing)
    finish()
    expect(screen.getByRole('region', { name: 'Source section 2' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Source section 3' })).toBeInTheDocument()
    expect(existing.querySelector('canvas')).toBe(sun)
    expect(reveal(existing)).toHaveAttribute('data-source-reveal', 'settled')
  })

  it('shows initially populated cards without an entrance or parent animation under StrictMode', () => {
    layout(360)
    render(<StrictMode><SourceSections sections={[first, second]} id="sequence-sections" /></StrictMode>)
    expect(heightPlayback.runs).toHaveLength(0)
    for (const index of [1, 2]) {
      const node = screen.getByRole('region', { name: `Source section ${index}` })
      expect(reveal(node)).toHaveAttribute('data-source-reveal', 'settled')
      expect(reveal(node)).not.toHaveAttribute('inert')
    }
  })

  it.each(['reduced motion', 'no observer'])('reveals appends immediately with %s, including later additions', mode => {
    const measured = layout(0, mode === 'reduced motion')
    if (mode === 'no observer') vi.stubGlobal('ResizeObserver', undefined)
    const view = render(<SourceSections sections={[]} id="sequence-sections" />)
    measured.state.intrinsic = 180
    view.rerender(<SourceSections sections={[first]} id="sequence-sections" />)
    const existing = screen.getByRole('region', { name: 'Source section 1' })
    measured.state.intrinsic = 360
    view.rerender(<SourceSections sections={[first, second]} id="sequence-sections" />)

    expect(heightPlayback.runs).toHaveLength(0)
    expect(outer().style.height).toBe('auto')
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(existing)
    for (const index of [1, 2]) {
      expect(reveal(screen.getByRole('region', { name: `Source section ${index}` }))).toHaveAttribute('data-source-reveal', 'settled')
    }
  })

  it('snaps a pending batch for a live reduced-motion change and cannot restart it on stale completion', () => {
    const measured = layout(0)
    const view = render(<SourceSections sections={[]} id="sequence-sections" />)
    measured.state.intrinsic = 180
    view.rerender(<SourceSections sections={[first]} id="sequence-sections" />)
    const node = card(first.text!)
    const sun = node.querySelector('canvas')
    const previous = heightPlayback.runs.at(-1)!
    expectPending(node)
    measured.reduce(true)

    expect(previous.stop).toHaveBeenCalledOnce()
    expect(outer().style.height).toBe('auto')
    expect(reveal(node)).toHaveAttribute('data-source-reveal', 'settled')
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(node)
    finish(previous)
    measured.reduce(false)
    expect(reveal(node)).toHaveAttribute('data-source-reveal', 'settled')
    expect(node.querySelector('canvas')).toBe(sun)
    expect(heightPlayback.runs).toHaveLength(1)
  })

  it('reveals new output immediately while existing card content has focus and preserves that focus', () => {
    const measured = layout(180)
    const view = render(<SourceSections sections={[first]} id="sequence-sections" />)
    const existing = screen.getByRole('region', { name: 'Source section 1' })
    const credit = existing.querySelector<HTMLAnchorElement>('a')!
    act(() => credit.focus())
    measured.state.intrinsic = 360
    view.rerender(<SourceSections sections={[first, second]} id="sequence-sections" />)

    expect(heightPlayback.runs).toHaveLength(0)
    expect(credit).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(existing)
    expect(reveal(screen.getByRole('region', { name: 'Source section 2' }))).toHaveAttribute('data-source-reveal', 'settled')
  })
})
