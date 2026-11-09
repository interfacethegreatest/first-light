import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { animate } from 'framer-motion'
import CalendarButton from '../src/components/calendarMotion/CalendarButton'
import CalendarPanel from '../src/components/calendarMotion/CalendarPanel'
import { useCalendarMotionPreferences } from '../src/components/calendarMotion/useCalendarMotionPreferences'

// Only stop the infinite border-color clock. Keep real motion DOM components,
// motion values, animation controls, and Tilt so native interactions stay real.
vi.mock('framer-motion', async importOriginal => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, animate: vi.fn(() => ({ stop: vi.fn() })) }
})

function motionPreferences({ reduced = false, coarse = false } = {}) {
  function mediaQuery(initial: boolean) {
    const listeners = new Set<() => void>()
    const media = {
      matches: initial,
      addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
      // Framer Motion also observes the legacy query; its listener is outside
      // this component's modern media subscription contract.
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
    return {
      media,
      listeners,
      change(matches: boolean) {
        act(() => {
          media.matches = matches
          for (const listener of listeners) listener()
        })
      },
    }
  }

  const reducedMotion = mediaQuery(reduced)
  const coarsePointer = mediaQuery(coarse)
  const other = mediaQuery(false)
  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    if (query.includes('prefers-reduced-motion')) return reducedMotion.media
    if (query === '(pointer: coarse)') return coarsePointer.media
    return other.media
  }))
  return { reducedMotion, coarsePointer }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Calendar action buttons', () => {
  it('keeps one accessible name and invokes the native click action once across visual label changes', async () => {
    motionPreferences()
    const user = userEvent.setup()
    const action = vi.fn()
    render(<CalendarButton label="Add source" hoverLabel="Save source" onClick={action} icon={<span>+</span>} />)
    const button = screen.getByRole('button', { name: 'Add source' })

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(button).toHaveAccessibleName('Add source')
    expect(screen.getByText('Save source').closest('[aria-hidden="true"]')).not.toBeNull()
    await user.hover(button)
    expect(button).toHaveAccessibleName('Add source')
    await user.click(button)
    expect(action).toHaveBeenCalledOnce()
    await user.keyboard('{Enter}')
    expect(action).toHaveBeenCalledTimes(2)
    expect(button).toHaveAccessibleName('Add source')
  })

  it('preserves native submit semantics without duplicating handlers', async () => {
    motionPreferences()
    const user = userEvent.setup()
    const clicked = vi.fn()
    const submitted = vi.fn()
    render(
      <form onSubmit={event => { event.preventDefault(); submitted() }}>
        <CalendarButton type="submit" label="Add decision" hoverLabel="Plan feature" onClick={clicked} />
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Add decision' }))
    expect(clicked).toHaveBeenCalledOnce()
    expect(submitted).toHaveBeenCalledOnce()
  })

  it('uses a non-submitting button by default', async () => {
    motionPreferences()
    const user = userEvent.setup()
    const submitted = vi.fn()
    const exported = vi.fn()
    render(
      <form onSubmit={event => { event.preventDefault(); submitted() }}>
        <CalendarButton label="Export workspace" hoverLabel="Download JSON" onClick={exported} />
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Export workspace' }))
    expect(exported).toHaveBeenCalledOnce()
    expect(submitted).not.toHaveBeenCalled()
  })

  it('keeps disabled buttons out of keyboard navigation and prevents click and submit actions', async () => {
    motionPreferences()
    const user = userEvent.setup()
    const clicked = vi.fn()
    const submitted = vi.fn()
    render(
      <form onSubmit={event => { event.preventDefault(); submitted() }}>
        <CalendarButton type="submit" disabled label="Add decision" hoverLabel="Plan feature" onClick={clicked} />
        <input aria-label="Next field" />
      </form>,
    )
    const button = screen.getByRole('button', { name: 'Add decision' })

    expect(button).toBeDisabled()
    await user.click(button)
    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Next field' })).toHaveFocus()
    expect(clicked).not.toHaveBeenCalled()
    expect(submitted).not.toHaveBeenCalled()
  })

  it('does not start a border cycle in reduced motion and stops active cycles on preference changes and unmount', () => {
    const preference = motionPreferences({ reduced: true })
    const view = render(<CalendarButton label="Add source" hoverLabel="Save source" />)
    const button = screen.getByRole('button', { name: 'Add source' })
    expect(button).toHaveAttribute('data-calendar-reduced-motion', 'true')
    expect(animate).not.toHaveBeenCalled()

    preference.reducedMotion.change(false)
    expect(button).toHaveAttribute('data-calendar-reduced-motion', 'false')
    expect(animate).toHaveBeenCalledOnce()
    const firstCycle = vi.mocked(animate).mock.results[0].value
    preference.reducedMotion.change(true)
    expect(firstCycle.stop).toHaveBeenCalledOnce()
    expect(animate).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Add source' })).toBe(button)

    preference.reducedMotion.change(false)
    expect(animate).toHaveBeenCalledTimes(2)
    const secondCycle = vi.mocked(animate).mock.results[1].value
    view.unmount()
    expect(secondCycle.stop).toHaveBeenCalledOnce()
  })
})

describe('Calendar panels and motion preferences', () => {
  it('preserves form nodes, entered values, and focus through live preference changes', async () => {
    const preference = motionPreferences()
    const user = userEvent.setup()
    render(
      <CalendarPanel>
        <section aria-label="Research panel">
          <form><label>Source title<input name="title" /></label></form>
        </section>
      </CalendarPanel>,
    )
    const field = screen.getByRole('textbox', { name: 'Source title' })
    const form = field.closest('form')
    await user.type(field, 'Unsubmitted research draft')
    expect(field).toHaveFocus()

    preference.reducedMotion.change(true)
    preference.coarsePointer.change(true)
    preference.reducedMotion.change(false)
    preference.coarsePointer.change(false)

    expect(screen.getByRole('textbox', { name: 'Source title' })).toBe(field)
    expect(field.closest('form')).toBe(form)
    expect(field).toHaveValue('Unsubmitted research draft')
    expect(field).toHaveFocus()
    expect(field.closest('.calendar-panel-tilt')).toHaveClass('calendar-panel-tilt-steady')
  })

  it('keeps controls steady while focus moves within a panel, then permits tilt after focus leaves', async () => {
    motionPreferences()
    const user = userEvent.setup()
    render(<>
      <CalendarPanel><label>Title<input /></label><label>Notes<textarea /></label></CalendarPanel>
      <button>Outside panel</button>
    </>)
    const field = screen.getByRole('textbox', { name: 'Title' })
    const tilt = field.closest('.calendar-panel-tilt')!
    expect(tilt).not.toHaveClass('calendar-panel-tilt-steady')

    await user.click(field)
    expect(tilt).toHaveClass('calendar-panel-tilt-steady')
    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus()
    expect(tilt).toHaveClass('calendar-panel-tilt-steady')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Outside panel' })).toHaveFocus()
    expect(tilt).not.toHaveClass('calendar-panel-tilt-steady')
  })

  it('keeps a coarse-pointer panel steady and reacts when pointer capabilities change', () => {
    const preference = motionPreferences({ coarse: true })
    render(<CalendarPanel><section aria-label="Research panel">Evidence</section></CalendarPanel>)
    const tilt = screen.getByRole('region', { name: 'Research panel' }).closest('.calendar-panel-tilt')!

    expect(tilt).toHaveClass('calendar-panel-tilt-steady')
    preference.coarsePointer.change(false)
    expect(tilt).not.toHaveClass('calendar-panel-tilt-steady')
    preference.reducedMotion.change(true)
    expect(tilt).toHaveClass('calendar-panel-tilt-steady')
  })

  it('cleans up both media subscriptions on unmount', () => {
    const preference = motionPreferences()
    const view = renderHook(() => useCalendarMotionPreferences())
    expect(preference.reducedMotion.listeners.size).toBe(1)
    expect(preference.coarsePointer.listeners.size).toBe(1)
    const reducedCallback = preference.reducedMotion.media.addEventListener.mock.calls[0][1]
    const coarseCallback = preference.coarsePointer.media.addEventListener.mock.calls[0][1]

    view.unmount()
    expect(preference.reducedMotion.media.removeEventListener).toHaveBeenCalledWith('change', reducedCallback)
    expect(preference.coarsePointer.media.removeEventListener).toHaveBeenCalledWith('change', coarseCallback)
    expect(preference.reducedMotion.listeners.size).toBe(0)
    expect(preference.coarsePointer.listeners.size).toBe(0)
  })

  it('supports browsers without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useCalendarMotionPreferences())
    expect(result.current).toEqual({ reducedMotion: false, coarsePointer: false })
  })
})
