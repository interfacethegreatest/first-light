import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewUserCard from '../src/components/cards/newUserCard/NewUserCard'
import { sourceSectionTemplate } from '../src/components/sources/sourceSectionTemplate'

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

beforeEach(() => {
  // Exercise the real no-WebGL path without importing or starting a renderer.
  vi.stubGlobal('WebGL2RenderingContext', undefined)
})

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

  it('keeps the real template output and controls usable when GPU rendering is unavailable', async () => {
    motionPreferences()
    const action = vi.fn()
    const user = userEvent.setup()
    const instance = sourceSectionTemplate.create()
    const view = render(sourceSectionTemplate.render(instance, 1, undefined, <button type="button" onClick={action}>Edit output</button>))
    const region = screen.getByRole('region', { name: 'Source section 1' })
    const scene = within(region).getByTestId('sun-scene')

    expect(scene).toHaveAttribute('data-sun-state', 'fallback')
    expect(scene).toHaveAttribute('aria-hidden', 'true')
    expect(region.querySelector('canvas')).toBeNull()
    expect(within(region).getByText(instance.text!)).toBeInTheDocument()
    await user.click(within(region).getByRole('button', { name: 'Edit output' }))
    expect(action).toHaveBeenCalledOnce()

    view.rerender(sourceSectionTemplate.render(instance, 1, <p>Updated output, independent of the renderer.</p>, <button type="button" onClick={action}>Edit output</button>))
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(region)
    expect(within(region).getByText('Updated output, independent of the renderer.')).toBeInTheDocument()
    expect(within(region).queryByText(instance.text!)).not.toBeInTheDocument()
    expect(within(region).getByTestId('sun-scene')).toHaveAttribute('data-sun-state', 'fallback')
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
})
