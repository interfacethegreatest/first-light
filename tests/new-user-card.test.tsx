import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewUserCard from '../src/components/cards/newUserCard/NewUserCard'
import { sourceSectionTemplate } from '../src/components/sources/sourceSectionTemplate'
import SunScene from '../src/components/react three fibre/sunScene/SunScene'

// Keep card content and controls real; actual WebGL is verified in the browser.
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: vi.fn() }))

const releaseSun = vi.fn()

function badgeActivity(hidden = false) {
  let state = hidden ? 'hidden' : 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state as DocumentVisibilityState)
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    disconnected = false
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this) }
    observe(target: Element) { this.target = target }
    disconnect() { this.disconnected = true }
    emit(inView: boolean) {
      this.callback([{ target: this.target!, isIntersecting: inView } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
  }
  vi.stubGlobal('IntersectionObserver', Observer)
  return {
    observers,
    intersect(target: Element, inView: boolean) {
      act(() => observers.filter(observer => observer.target === target && !observer.disconnected).forEach(observer => observer.emit(inView)))
    },
    visible(value: boolean) {
      act(() => { state = value ? 'visible' : 'hidden';document.dispatchEvent(new Event('visibilitychange')) })
    },
  }
}

beforeEach(() => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.mocked(SunScene).mockImplementation(function Preview() {
    useEffect(() => () => releaseSun(), [])
    return <div data-testid="sun-preview-boundary" />
  })
})

function motionPreferences() {
  function query() {
    const listeners = new Set<() => void>()
    const media = {
      matches: false,
      addEventListener: vi.fn((_type: string, callback: () => void) => listeners.add(callback)),
      removeEventListener: vi.fn((_type: string, callback: () => void) => listeners.delete(callback)),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
    return {
      media,
      listeners,
      change(matches: boolean) {
        act(() => {
          media.matches = matches
          listeners.forEach(callback => callback())
        })
      },
    }
  }
  const reduced = query()
  const coarse = query()
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('prefers-reduced-motion') ? reduced.media : coarse.media))
  return { reduced, coarse }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Calendar NewUserCard integration', () => {
  it('retains card metadata, content, attribution, and native controls across repeated instances', async () => {
    motionPreferences()
    const action = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<>
      <NewUserCard headingId="first-card-heading" title="First research card" borderTone="slatepurple" controls={<button type="button" onClick={action}>Edit first card</button>}>
        <p>First research output.</p>
      </NewUserCard>
      <NewUserCard headingId="second-card-heading" title="Second research card"><p>Second research output.</p></NewUserCard>
    </>)
    const first = screen.getByRole('region', { name: 'First research card' })
    const second = screen.getByRole('region', { name: 'Second research card' })

    expect(first).toHaveAttribute('aria-labelledby', 'first-card-heading')
    expect(first).toHaveAttribute('data-border-tone', 'slatepurple')
    expect(second).toHaveAttribute('aria-labelledby', 'second-card-heading')
    expect(within(first).getByText('First research output.')).toBeInTheDocument()
    expect(within(second).getByText('Second research output.')).toBeInTheDocument()
    const ids = Array.from(container.querySelectorAll('[id]'), element => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(within(first).getByRole('link', { name: 'Sun' })).toHaveAttribute('href', 'https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914')
    expect(within(first).getByText(/by Akshat/)).toBeInTheDocument()
    expect(within(first).getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/')

    const button = within(first).getByRole('button', { name: 'Edit first card' })
    await user.click(button)
    expect(action).toHaveBeenCalledOnce()
    await user.keyboard('{Enter}')
    expect(action).toHaveBeenCalledTimes(2)
    expect(within(second).queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps real template output and native controls independent from the GPU scene', async () => {
    motionPreferences()
    const action = vi.fn()
    const user = userEvent.setup()
    const instance = sourceSectionTemplate.create()
    const view = render(sourceSectionTemplate.render(instance, 1, undefined, <button type="button" onClick={action}>Edit output</button>))
    const region = screen.getByRole('region', { name: 'Source section 1' })
    expect(region.querySelector('canvas')).toBeNull()
    expect(within(region).getByText(instance.text!)).toBeInTheDocument()
    await user.click(within(region).getByRole('button', { name: 'Edit output' }))
    expect(action).toHaveBeenCalledOnce()

    view.rerender(sourceSectionTemplate.render(instance, 1, <p>Updated output, independent of the renderer.</p>, <button type="button" onClick={action}>Edit output</button>))
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(region)
    expect(within(region).getByText('Updated output, independent of the renderer.')).toBeInTheDocument()
    expect(within(region).queryByText(instance.text!)).not.toBeInTheDocument()
  })

  it('preserves focused form output through live preferences and cleans up media subscriptions', async () => {
    const preference = motionPreferences()
    const user = userEvent.setup()
    const view = render(<NewUserCard headingId="editable-card-heading" title="Editable card"><label>Output notes<textarea /></label></NewUserCard>)
    const field = screen.getByRole('textbox', { name: 'Output notes' })
    await user.type(field, 'Unsubmitted output notes')

    preference.reduced.change(true)
    preference.coarse.change(true)
    preference.reduced.change(false)
    preference.coarse.change(false)

    expect(screen.getByRole('textbox', { name: 'Output notes' })).toBe(field)
    expect(field).toHaveValue('Unsubmitted output notes')
    expect(field).toHaveFocus()
    expect(screen.getByRole('region', { name: 'Editable card' })).toContainElement(field)
    view.unmount()
    expect(preference.reduced.listeners.size).toBe(0)
    expect(preference.coarse.listeners.size).toBe(0)
  })

  it('requests only visible Sun badges and releases their scenes offscreen or hidden without replacing native content', async () => {
    const preference = motionPreferences()
    const activity = badgeActivity()
    const remove = vi.spyOn(document, 'removeEventListener')
    const user = userEvent.setup()
    const view = render(<NewUserCard headingId="deferred-sun-title" title="Deferred Sun"><label>Retained draft<textarea /></label></NewUserCard>)
    const region = screen.getByRole('region', { name: 'Deferred Sun' })
    const badge = region.querySelector('[data-source-sun]')!
    const field = screen.getByRole('textbox', { name: 'Retained draft' })
    expect(activity.observers[0].target).toBe(badge)
    expect(SunScene).not.toHaveBeenCalled()
    await user.type(field, 'Native output remains focused')

    activity.intersect(badge, true)
    const firstPreview = await screen.findByTestId('sun-preview-boundary')
    activity.intersect(badge, false)
    expect(screen.queryByTestId('sun-preview-boundary')).not.toBeInTheDocument()
    expect(releaseSun).toHaveBeenCalledOnce()
    activity.intersect(badge, true)
    expect(await screen.findByTestId('sun-preview-boundary')).not.toBe(firstPreview)
    activity.visible(false)
    expect(screen.queryByTestId('sun-preview-boundary')).not.toBeInTheDocument()
    expect(releaseSun).toHaveBeenCalledTimes(2)
    activity.visible(true)
    const reducedPreview = await screen.findByTestId('sun-preview-boundary')
    preference.reduced.change(true)
    expect(screen.getByTestId('sun-preview-boundary')).toBe(reducedPreview)
    expect(screen.getByRole('region', { name: 'Deferred Sun' })).toBe(region)
    expect(screen.getByRole('textbox', { name: 'Retained draft' })).toBe(field)
    expect(field).toHaveValue('Native output remains focused')
    expect(field).toHaveFocus()

    view.unmount()
    expect(releaseSun).toHaveBeenCalledTimes(3)
    expect(activity.observers.every(observer => observer.disconnected)).toBe(true)
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    const calls = vi.mocked(SunScene).mock.calls.length
    act(() => activity.observers.forEach(observer => observer.emit(true)))
    activity.visible(true)
    expect(SunScene).toHaveBeenCalledTimes(calls)
  })

  it('contains a deferred scene error while retaining attribution and working native controls', async () => {
    motionPreferences()
    const activity = badgeActivity()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(SunScene).mockImplementation(() => { throw new Error('Local decorative scene unavailable') })
    const action = vi.fn(), user = userEvent.setup()
    render(<NewUserCard headingId="failed-sun-title" title="Working card" controls={<button onClick={action}>Edit output</button>}><p>Research stays available.</p></NewUserCard>)
    activity.intersect(document.querySelector('[data-source-sun]')!, true)
    await act(async () => {})
    expect(screen.getByRole('region', { name: 'Working card' })).toHaveTextContent('Research stays available.')
    expect(screen.getByRole('link', { name: 'Sun' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit output' }))
    expect(action).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('sun-preview-boundary')).not.toBeInTheDocument()
  })
})
