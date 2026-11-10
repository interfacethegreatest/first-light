import { StrictMode, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreeDHeading from '../src/components/typography/ThreeDHeading'
import FooterTextCanvas from '../src/components/typography/FooterTextCanvas'

vi.mock('../src/components/typography/FooterTextCanvas', () => ({ default: vi.fn() }))

function environment(webgl = true) {
  const listeners = new Set<() => void>()
  const media = { matches: false, addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)), removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)), addListener: vi.fn(), removeListener: vi.fn() }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('WebGLRenderingContext', webgl ? class {} : undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  let visibility = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility as DocumentVisibilityState)
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    disconnected = false
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    observe = vi.fn((target: Element) => { this.target = target })
    disconnect = vi.fn(() => { this.disconnected = true })
    emit(value: boolean) { this.callback([{ target: this.target!, isIntersecting: value } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
  }
  vi.stubGlobal('IntersectionObserver', Observer)
  return {
    observers, listeners,
    intersect(target: Element, value: boolean) { act(() => observers.filter(o => !o.disconnected && o.target === target).forEach(o => o.emit(value))) },
    hidden(value: boolean) { act(() => { visibility = value ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')) }) },
    reduced(value: boolean) { act(() => { media.matches = value; listeners.forEach(listener => listener()) }) },
  }
}
function scene(container: HTMLElement) { return container.querySelector('[data-footer-text-state]')! }
function renderer() { return vi.mocked(FooterTextCanvas).mock.calls.at(-1)![0] }

beforeEach(() => { vi.mocked(FooterTextCanvas).mockImplementation(({ animate, text }) => <div data-testid="heading-gpu-boundary" data-animate={animate} data-text={text} />) })
afterEach(() => { vi.unstubAllGlobals() })

describe('reusable accessible 3D heading', () => {
  it('uses one native heading with caller id/level and keeps native children accessible without WebGL', () => {
    environment(false)
    const view = render(<ThreeDHeading title="Research direction" id="research-title" level="h3"><label>Native draft<input /></label></ThreeDHeading>)
    expect(screen.getAllByRole('heading', { name: 'Research direction', level: 3 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Research direction' })).toHaveAttribute('id', 'research-title')
    expect(screen.getByRole('textbox', { name: 'Native draft' }).closest('[aria-hidden="true"]')).toBeNull()
    expect(screen.queryByRole('img', { name: 'Research direction' })).not.toBeInTheDocument()
    expect(FooterTextCanvas).not.toHaveBeenCalled()
    view.unmount()
    render(<ThreeDHeading />)
    expect(screen.getAllByRole('heading', { name: 'Default Title', level: 2 })).toHaveLength(1)
  })

  it('loads a static visual only after visibility and preserves the same children through preferences and failure', async () => {
    const activity = environment()
    const user = userEvent.setup()
    const view = render(<StrictMode><ThreeDHeading title="Stable heading"><label>Preserved draft<input /></label></ThreeDHeading></StrictMode>)
    const visual = scene(view.container)
    expect(FooterTextCanvas).not.toHaveBeenCalled()
    activity.intersect(visual, true)
    const canvas = await screen.findByTestId('heading-gpu-boundary')
    expect(canvas).toHaveAttribute('data-animate', 'false')
    const callbacks = renderer()
    act(() => callbacks.onReady?.())
    expect(visual).toHaveAttribute('data-footer-text-state', 'loaded')
    const input = screen.getByRole('textbox', { name: 'Preserved draft' })
    await user.type(input, 'Keep this native draft')
    activity.hidden(true);activity.hidden(false);activity.reduced(true);activity.reduced(false);activity.intersect(visual, false);activity.intersect(visual, true)
    expect(screen.getByTestId('heading-gpu-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-animate', 'false')
    act(() => callbacks.onUnavailable?.())
    expect(visual).toHaveAttribute('data-footer-text-state', 'unavailable')
    expect(screen.getByRole('textbox', { name: 'Preserved draft' })).toBe(input)
    expect(input).toHaveValue('Keep this native draft')
    expect(input).toHaveFocus()
    expect(screen.getAllByRole('heading', { name: 'Stable heading' })).toHaveLength(1)
    act(() => callbacks.onReady?.())
    expect(visual).toHaveAttribute('data-footer-text-state', 'unavailable')
    view.unmount()
    expect(activity.observers.every(o => o.disconnected)).toBe(true)
    expect(activity.listeners.size).toBe(0)
  })

  it('changes heading metadata without resetting stateful child components or a focused native field', async () => {
    environment(false)
    function Child() { const [count, setCount] = useState(0); return <><button onClick={() => setCount(n => n + 1)}>Count {count}</button><label>Child field<input /></label></> }
    const user = userEvent.setup()
    const view = render(<ThreeDHeading title="First heading"><Child /></ThreeDHeading>)
    await user.click(screen.getByRole('button', { name: 'Count 0' }))
    const input = screen.getByRole('textbox', { name: 'Child field' })
    await user.type(input, 'State stays here')
    view.rerender(<ThreeDHeading title="Updated heading" id="updated-heading" level="h1"><Child /></ThreeDHeading>)
    expect(screen.getByRole('heading', { name: 'Updated heading', level: 1 })).toHaveAttribute('id', 'updated-heading')
    expect(screen.queryByRole('heading', { name: 'First heading' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Child field' })).toBe(input)
    expect(input).toHaveValue('State stays here')
    expect(input).toHaveFocus()
  })

  it('contains a thrown visual renderer failure while native child forms still submit', async () => {
    const activity = environment()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(FooterTextCanvas).mockImplementation(() => { throw new Error('Bold font unavailable') })
    const submit = vi.fn(), user = userEvent.setup()
    const view = render(<form onSubmit={event => { event.preventDefault(); submit() }}><ThreeDHeading title="Native form"><label>Evidence<input required /></label><button type="submit">Save</button></ThreeDHeading></form>)
    const input = screen.getByRole('textbox', { name: 'Evidence' })
    await user.type(input, 'Still usable')
    activity.intersect(scene(view.container), true)
    await waitFor(() => expect(scene(view.container)).toHaveAttribute('data-footer-text-state', 'unavailable'))
    expect(input).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(submit).toHaveBeenCalledOnce()
    expect(screen.getAllByRole('heading', { name: 'Native form' })).toHaveLength(1)
  })
})
