import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnimatedHeight from '../src/components/sources/AnimatedHeight'
import SourceSections from '../src/components/sources/SourceSections'
import useSourceSections from '../src/components/sources/useSourceSections'

interface Transition {
  from: unknown
  target: number
  duration?: number
  stop: ReturnType<typeof vi.fn>
  complete: () => void
}

const playback = vi.hoisted(() => ({ transitions: [] as Transition[] }))

// Keep real motion elements/values. Control only the animation completion event;
// the component itself must pin/release DOM height, overflow, and child identity.
vi.mock('framer-motion', async importOriginal => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return {
    ...actual,
    animate: vi.fn((value: { get(): unknown }, target: number, options: { duration?: number; onComplete?: () => void }) => {
      const stop = vi.fn()
      playback.transitions.push({ from: value.get(), target, duration: options.duration, stop, complete: () => options.onComplete?.() })
      return { stop }
    }),
  }
})

// Preserve the feature's real hook, list, cards, and metadata; omit only WebGL.
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({
  default: () => <canvas data-testid="sun-boundary" />,
}))

function controlledLayout(initialHeight: number, reducedMotion = false) {
  const layout = { intrinsic: initialHeight, current: undefined as number | undefined }
  const observers: Observer[] = []
  class Observer {
    target: Element | null = null
    disconnected = false
    observe = vi.fn((target: Element) => { this.target = target })
    disconnect = vi.fn(() => { this.disconnected = true })
    constructor(readonly callback: ResizeObserverCallback) { observers.push(this) }
  }
  vi.stubGlobal('ResizeObserver', Observer)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.style.display === 'flow-root') return layout.intrinsic
    return layout.current ?? (this.style.height === 'auto' ? layout.intrinsic : Number.parseFloat(this.style.height) || 0)
  })

  function query(matches: boolean) {
    const listeners = new Set<() => void>()
    const media = {
      matches,
      addEventListener: vi.fn((_name: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_name: string, listener: () => void) => listeners.delete(listener)),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
    return { media, listeners }
  }
  const reduced = query(reducedMotion)
  const coarse = query(false)
  vi.stubGlobal('matchMedia', vi.fn((name: string) => name.includes('prefers-reduced-motion') ? reduced.media : coarse.media))

  return {
    layout,
    observers,
    reduced,
    coarse,
    resize(height: number) {
      layout.intrinsic = height
      const observer = observers.filter(item => !item.disconnected).at(-1)!
      act(() => observer.callback([{
        target: observer.target!,
        // A border-box measurement includes spacing that contentRect excludes.
        contentRect: new DOMRect(0, 0, 100, Math.max(0, height - 20)),
        borderBoxSize: [{ inlineSize: 100, blockSize: height }],
        contentBoxSize: [{ inlineSize: 100, blockSize: Math.max(0, height - 20) }],
        devicePixelContentBoxSize: [{ inlineSize: 100, blockSize: Math.max(0, height - 20) }],
      }], observer as unknown as ResizeObserver))
    },
    reduce(matches: boolean) {
      act(() => {
        reduced.media.matches = matches
        reduced.listeners.forEach(listener => listener())
      })
    },
  }
}

function frame() {
  return screen.getByTestId('content').parentElement!.parentElement!
}

function latestTransition() {
  return playback.transitions.at(-1)!
}

function complete(transition = latestTransition()) {
  act(() => transition.complete())
}

beforeEach(() => {
  playback.transitions.length = 0
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AnimatedHeight layout lifecycle', () => {
  it.each([false, true])('shows initial content at natural height without an entrance animation (reduced motion: %s)', reduced => {
    controlledLayout(140, reduced)
    render(<AnimatedHeight><div data-testid="content">Existing output</div></AnimatedHeight>)

    expect(screen.getByText('Existing output')).toBeInTheDocument()
    expect(frame().style.height).toBe('auto')
    expect(frame().style.overflow).toBe('visible')
    expect(playback.transitions).toHaveLength(0)
  })

  it('grows from empty and shrinks with content, then releases fixed bounds after each completion', () => {
    const environment = controlledLayout(0)
    const view = render(<AnimatedHeight><div data-testid="content" /></AnimatedHeight>)
    const outer = frame()
    view.rerender(<AnimatedHeight><div data-testid="content">New output</div></AnimatedHeight>)
    environment.resize(180)

    expect(outer.style.height).toBe('0px')
    expect(outer.style.overflow).toBe('hidden')
    expect(screen.getByText('New output')).toBeInTheDocument()
    expect(latestTransition()).toMatchObject({ from: 0, target: 180 })
    expect(latestTransition().duration).toBeCloseTo(0.3)
    complete()
    expect(outer.style.height).toBe('auto')
    expect(outer.style.overflow).toBe('visible')

    view.rerender(<AnimatedHeight><div data-testid="content">Short output</div></AnimatedHeight>)
    environment.resize(60)
    expect(outer.style.height).toBe('180px')
    expect(latestTransition()).toMatchObject({ from: 180, target: 60 })
    complete()
    expect(outer.style.height).toBe('auto')
    expect(outer.style.overflow).toBe('visible')
    environment.resize(60)
    expect(playback.transitions).toHaveLength(2)
  })

  it('retargets from the current displayed height and ignores completion from the cancelled transition', () => {
    const environment = controlledLayout(0)
    render(<AnimatedHeight><div data-testid="content">Stable output</div></AnimatedHeight>)
    const content = screen.getByTestId('content')
    const outer = frame()
    environment.resize(100)
    const previous = latestTransition()
    environment.layout.current = 40
    environment.resize(180)

    expect(previous.stop).toHaveBeenCalledOnce()
    expect(outer.style.height).toBe('40px')
    expect(latestTransition()).toMatchObject({ from: 40, target: 180 })
    complete(previous)
    expect(outer.style.height).toBe('40px')
    expect(outer.style.overflow).toBe('hidden')
    expect(screen.getByTestId('content')).toBe(content)
    complete()
    expect(outer.style.height).toBe('auto')
    expect(outer.style.overflow).toBe('visible')
  })

  it('retargets content changes discovered at completion before releasing natural height', () => {
    const environment = controlledLayout(100)
    render(<AnimatedHeight><div data-testid="content">Asynchronous output</div></AnimatedHeight>)
    environment.resize(200)
    const previous = latestTransition()
    environment.layout.intrinsic = 260
    environment.layout.current = 200
    complete(previous)

    expect(frame().style.height).toBe('200px')
    expect(frame().style.overflow).toBe('hidden')
    expect(latestTransition()).toMatchObject({ from: 200, target: 260 })
    expect(playback.transitions).toHaveLength(2)
    complete()
    expect(frame().style.height).toBe('auto')
  })

  it('snaps a live reduced-motion change without remounting or replaying earlier growth', () => {
    const environment = controlledLayout(100)
    render(<AnimatedHeight><input data-testid="content" aria-label="Draft" defaultValue="Kept draft" /></AnimatedHeight>)
    const field = screen.getByRole('textbox', { name: 'Draft' })
    environment.resize(200)
    const previous = latestTransition()
    environment.reduce(true)

    expect(previous.stop).toHaveBeenCalledOnce()
    expect(frame().style.height).toBe('auto')
    expect(frame().style.overflow).toBe('visible')
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(field)
    expect(field).toHaveValue('Kept draft')
    environment.layout.intrinsic = 300
    environment.reduce(false)
    expect(playback.transitions).toHaveLength(1)
    expect(frame().style.height).toBe('auto')
    environment.resize(350)
    expect(latestTransition()).toMatchObject({ from: 300, target: 350 })
  })

  it('keeps focused output steady while allowing an external focused button to trigger later growth', async () => {
    const environment = controlledLayout(100)
    const user = userEvent.setup()
    render(<><button type="button">Outside button</button><AnimatedHeight><input data-testid="content" aria-label="Draft" defaultValue="Draft value" /></AnimatedHeight></>)
    const field = screen.getByRole('textbox', { name: 'Draft' })
    environment.resize(200)
    const previous = latestTransition()
    await user.click(field)

    expect(previous.stop).toHaveBeenCalledOnce()
    expect(frame().style.height).toBe('auto')
    expect(frame().style.overflow).toBe('visible')
    expect(field).toHaveFocus()
    expect(field).toHaveValue('Draft value')
    environment.resize(250)
    expect(playback.transitions).toHaveLength(1)
    expect(frame().style.height).toBe('auto')
    await user.click(screen.getByRole('button', { name: 'Outside button' }))
    expect(playback.transitions).toHaveLength(1)
    environment.resize(300)
    expect(frame().style.height).toBe('250px')
    expect(latestTransition()).toMatchObject({ from: 250, target: 300 })
    expect(screen.getByRole('button', { name: 'Outside button' })).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(field)
  })

  it('resumes growth if a focused child is removed without a blur event', async () => {
    const environment = controlledLayout(100)
    const user = userEvent.setup()
    const view = render(<AnimatedHeight><input data-testid="content" aria-label="Temporary draft" /></AnimatedHeight>)
    await user.click(screen.getByRole('textbox', { name: 'Temporary draft' }))
    environment.resize(120)
    expect(playback.transitions).toHaveLength(0)

    // Browsers can remove the active node without dispatching React's blur.
    view.rerender(<AnimatedHeight><div data-testid="content">Replacement output<input aria-label="Replacement draft" /></div></AnimatedHeight>)
    environment.resize(240)

    expect(frame().style.height).toBe('120px')
    expect(latestTransition()).toMatchObject({ from: 120, target: 240 })
    const resumed = latestTransition()
    await user.click(screen.getByRole('textbox', { name: 'Replacement draft' }))
    expect(resumed.stop).toHaveBeenCalledOnce()
    expect(frame().style.height).toBe('auto')
    complete()
    expect(frame().style.height).toBe('auto')
    expect(screen.getByText('Replacement output')).toBeInTheDocument()
  })

  it('cleans observers, subscriptions, and playback under StrictMode and ignores completion after unmount', () => {
    const environment = controlledLayout(100)
    const view = render(<StrictMode><AnimatedHeight><div data-testid="content">Output</div></AnimatedHeight></StrictMode>)
    expect(playback.transitions).toHaveLength(0)
    environment.resize(200)
    const previous = latestTransition()
    const outer = frame()
    view.unmount()

    expect(previous.stop).toHaveBeenCalledOnce()
    expect(environment.observers.every(observer => observer.disconnected)).toBe(true)
    expect(environment.reduced.listeners.size).toBe(0)
    expect(environment.coarse.listeners.size).toBe(0)
    environment.layout.intrinsic = 350
    complete(previous)
    expect(playback.transitions).toHaveLength(1)
    expect(outer.style.height).toBe('auto')
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('leaves content naturally sized when ResizeObserver is unavailable', () => {
    const environment = controlledLayout(80)
    vi.stubGlobal('ResizeObserver', undefined)
    const view = render(<AnimatedHeight><div data-testid="content">Initial output</div></AnimatedHeight>)
    environment.layout.intrinsic = 300
    view.rerender(<AnimatedHeight><div data-testid="content">Updated larger output</div></AnimatedHeight>)

    expect(screen.getByText('Updated larger output')).toBeInTheDocument()
    expect(frame().style.height).toBe('auto')
    expect(frame().style.overflow).toBe('visible')
    expect(playback.transitions).toHaveLength(0)
  })

  it('integrates with SourceSections while retaining source and Sun nodes across additions and motion changes', async () => {
    const environment = controlledLayout(0)
    function Feature() {
      const { sourceSections, introduceSourceSection } = useSourceSections()
      return <><button type="button" onClick={introduceSourceSection}>Add source</button><SourceSections sections={sourceSections} id="height-test-sources" /></>
    }
    const user = userEvent.setup()
    render(<Feature />)
    const button = screen.getByRole('button', { name: 'Add source' })
    await user.click(button)
    const first = screen.getByRole('region', { name: 'Source section 1' })
    const sun = first.querySelector('canvas')
    const outer = document.getElementById('height-test-sources')!.parentElement!.parentElement!
    environment.resize(180)

    expect(button).toHaveFocus()
    expect(outer.style.height).toBe('0px')
    complete()
    expect(outer.style.height).toBe('auto')
    await user.click(button)
    environment.resize(360)
    expect(outer.style.height).toBe('180px')
    expect(screen.getByRole('region', { name: 'Source section 2' })).toBeInTheDocument()
    environment.reduce(true)

    expect(outer.style.height).toBe('auto')
    expect(outer.style.overflow).toBe('visible')
    expect(screen.getByRole('region', { name: 'Source section 1' })).toBe(first)
    expect(first.querySelector('canvas')).toBe(sun)
    expect(sun).toBeInTheDocument()
  })
})
