import { Children, Suspense, isValidElement, type Ref } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import SunMarkCanvas from '../src/components/misc/SunMark/SunMarkCanvas'

vi.mock('@react-three/fiber', () => ({ Canvas: vi.fn(), useFrame: vi.fn() }))
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  useGLTF: Object.assign(vi.fn(), { preload: vi.fn() }),
}))

function configuredCanvas() { return vi.mocked(Canvas).mock.calls.at(-1)![0] }
function modelProps() {
  const suspense = Children.toArray(configuredCanvas().children).find(child => isValidElement(child) && child.type === Suspense)
  if (!isValidElement<{ children: { props: { animate?: boolean; rotationAxis?: string; rotationSpeed?: number; onReady: () => void } } }>(suspense)) throw new Error('Missing model suspense boundary')
  return suspense.props.children.props
}
function controls() { return Children.toArray(configuredCanvas().children).filter(isValidElement).find(child => child.type === OrbitControls) }

beforeEach(() => {
  vi.mocked(Canvas).mockImplementation(props => <canvas ref={(props as { ref?: Ref<HTMLCanvasElement> }).ref} data-testid="canvas-boundary" data-frameloop={props.frameloop} />)
})

afterEach(() => { vi.unstubAllGlobals() })

describe('Sun renderer boundary', () => {
  it('uses a bounded transparent orthographic canvas with local lights and no default drag controls', () => {
    vi.stubGlobal('devicePixelRatio', 4)
    render(<SunMarkCanvas />)
    const config = configuredCanvas()
    expect(config.orthographic).toBe(true)
    expect(config.camera).toMatchObject({ left: -2.86, right: 2.86, top: 2.86, bottom: -2.86 })
    expect(config.gl).toMatchObject({ alpha: true })
    expect(config.dpr).toBeLessThanOrEqual(2)
    expect(config.frameloop).toBe('demand')
    expect(controls()).toBeUndefined()
    const children = Children.toArray(config.children).filter(isValidElement)
    expect(children.find(child => child.type === 'ambientLight')).toHaveProperty('props.intensity', 0.35)
    expect(children.find(child => child.type === 'hemisphereLight')).toHaveProperty('props.args', ['#ffffff', '#808080', 0.6])
    expect(children.filter(child => child.type === 'directionalLight').map(child => child.props)).toEqual([
      { position: [3, 4, 5], intensity: 2 }, { position: [-4, -2, 1], intensity: 0.25 },
    ])
  })

  it('forwards axis and speed while switching between demand and automatic frames without replacing the canvas', () => {
    const view = render(<SunMarkCanvas animate rotationAxis="x" rotationSpeed={0.3} />)
    const canvas = screen.getByTestId('canvas-boundary')
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(modelProps()).toMatchObject({ animate: true, rotationAxis: 'x', rotationSpeed: 0.3 })
    view.rerender(<SunMarkCanvas animate rotationAxis="z" rotationSpeed={0} />)
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(modelProps()).toMatchObject({ animate: false, rotationAxis: 'z', rotationSpeed: 0 })
    view.rerender(<SunMarkCanvas animate={false} />)
    expect(screen.getByTestId('canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
  })

  it('enables deliberate desktop rotation only when explicitly interactive, without zoom or pan', () => {
    const view = render(<SunMarkCanvas interactive />)
    expect(controls()).toHaveProperty('props.enableZoom', false)
    expect(controls()).toHaveProperty('props.enablePan', false)
    view.rerender(<SunMarkCanvas interactive={false} />)
    expect(controls()).toBeUndefined()
  })

  it('removes its context listener and ignores queued first readiness on unmount', () => {
    const ready = vi.fn(), unavailable = vi.fn()
    const view = render(<SunMarkCanvas onReady={ready} onUnavailable={unavailable} />)
    const canvas = screen.getByTestId('canvas-boundary')
    const afterRender = modelProps().onReady
    const remove = vi.spyOn(canvas, 'removeEventListener')
    view.unmount()
    expect(remove).toHaveBeenCalledWith('webglcontextlost', expect.any(Function))
    act(() => afterRender())
    fireEvent(canvas, new Event('webglcontextlost'))
    expect(ready).not.toHaveBeenCalled()
    expect(unavailable).not.toHaveBeenCalled()
  })

  it('handles context loss once, removes its listener and ignores late readiness', () => {
    const firstReady = vi.fn(), latestReady = vi.fn(), unavailable = vi.fn()
    const view = render(<SunMarkCanvas onReady={firstReady} onUnavailable={unavailable} />)
    const canvas = screen.getByTestId('canvas-boundary')
    const ready = modelProps().onReady
    view.rerender(<SunMarkCanvas onReady={latestReady} onUnavailable={unavailable} />)
    act(() => ready())
    expect(firstReady).not.toHaveBeenCalled()
    expect(latestReady).toHaveBeenCalledOnce()
    const remove = vi.spyOn(canvas, 'removeEventListener')
    const lost = new Event('webglcontextlost', { cancelable: true })
    fireEvent(canvas, lost)
    expect(lost.defaultPrevented).toBe(true)
    expect(unavailable).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('canvas-boundary')).not.toBeInTheDocument()
    expect(remove).toHaveBeenCalledWith('webglcontextlost', expect.any(Function))
    act(() => ready())
    fireEvent(canvas, new Event('webglcontextlost'))
    expect(latestReady).toHaveBeenCalledOnce()
    expect(unavailable).toHaveBeenCalledOnce()
    view.unmount()
  })
})
