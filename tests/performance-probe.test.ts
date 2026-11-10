import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

const source = readFileSync('public/performance/probe.js', 'utf8')

interface ProbeResult {
  status: string
  reasons: string[]
  submittedFrames: number
  submittedFramesPerSecond: number | null
  submittedFrameIntervals: { medianIntervalMs: number | null; p95IntervalMs: number | null; intervalSamples: number }
  observedRafCallbacks: { samples: number }
}
interface Probe {
  start: (kind: string) => void
  finish: (reason?: string) => ProbeResult
  dispose: () => void
  snapshot: () => { draws: { torus: number; panel: number }; patchFailures: number; capability: unknown }
}

function environment(kind = 'torus') {
  let now = 0
  const callbacks: FrameRequestCallback[] = []
  const card = {
    kind, spin: 'true',
    getAttribute(name: string) { return name === 'data-glass-object-kind' ? this.kind : this.spin },
  }
  class FakeDocument extends EventTarget {
    visibilityState = 'visible'
    querySelector(selector: string) { return selector.includes(card.kind) ? card : null }
  }
  class FakeMotion extends EventTarget { matches = false }
  class FakeGL {
    FRAMEBUFFER_BINDING = 0x8ca6
    DRAW_FRAMEBUFFER_BINDING = 0x8ca6
    VERSION = 0x1f02
    SHADING_LANGUAGE_VERSION = 0x8b8c
    VENDOR = 0x1f00
    RENDERER = 0x1f01
    MAX_TEXTURE_SIZE = 0x0d33
    getParameter(parameter: number) { return parameter === this.FRAMEBUFFER_BINDING ? null : 'test-renderer' }
    getExtension() { return null }
    bindFramebuffer(_target: number, _buffer: object | null) { /* WebGL call succeeds. */ }
    drawElements(_mode: number, _count: number, _type = 0, _offset = 0) { /* WebGL call succeeds. */ }
    drawArrays(_mode: number, _first: number, _count: number) { /* WebGL call succeeds. */ }
    drawElementsInstanced(_mode: number, _count: number, _type: number, _offset: number, _instances: number) { /* WebGL call succeeds. */ }
  }
  const gl = new FakeGL()
  class FakeCanvas extends EventTarget {
    testid = 'glass-object-canvas'
    getContext(_type?: string) { return gl }
    // Fiber puts data-testid on Canvas's DOM wrapper, not its native canvas.
    closest(selector: string) {
      return selector.includes('data-testid') ? (this.testid === 'glass-object-canvas' ? {} : null) : card
    }
    getAttribute() { return null }
  }
  class FakeWindow extends EventTarget {
    document = new FakeDocument()
    HTMLCanvasElement = FakeCanvas
    performance = { now: () => now }
    matchMedia = () => motion
    requestAnimationFrame(callback: FrameRequestCallback) { callbacks.push(callback); return callbacks.length }
    __firstLightProbe!: Probe
  }
  const motion = new FakeMotion()
  const win = new FakeWindow()
  const originalRaf = win.requestAnimationFrame
  const originalGetContext = FakeCanvas.prototype.getContext
  const originalDraw = gl.drawElements
  runInNewContext(source, { window: win })
  const canvas = new FakeCanvas()
  canvas.getContext('webgl2')
  function frame(timestamp: number, draw = () => {}) {
    now = timestamp
    win.requestAnimationFrame(draw)
    callbacks.splice(0).forEach(callback => callback(timestamp))
  }
  return {
    win, gl, canvas, card, motion, probe: win.__firstLightProbe, frame,
    originalRaf, originalGetContext, originalDraw,
    time(value: number) { now = value },
  }
}

describe('opt-in device probe counts actual main-framebuffer host draws', () => {
  it('deduplicates host passes and rAF callbacks at the same timestamp; reports real intervals', () => {
    const test = environment()
    test.probe.start('torus')
    test.frame(16, () => { test.gl.drawElements(4, 55296); test.gl.drawElements(4, 55296) })
    test.frame(16, () => test.gl.drawElements(4, 55296))
    test.frame(36, () => test.gl.drawElements(4, 55296))
    test.frame(76, () => test.gl.drawElements(4, 55296))
    test.time(1000)
    const result = test.probe.finish()
    expect(result.status).toBe('measured')
    expect(result.submittedFrames).toBe(3)
    expect(result.submittedFramesPerSecond).toBe(3)
    expect(result.submittedFrameIntervals.medianIntervalMs).toBe(30)
    expect(result.submittedFrameIntervals.p95IntervalMs).toBe(39)
    expect(test.probe.snapshot().capability).not.toBeNull()
    test.probe.dispose()
  })

  it('excludes refraction FBOs, wrong geometry, other canvases, and draws outside rAF', () => {
    const test = environment()
    test.probe.start('torus')
    test.gl.drawElements(4, 55296)
    test.frame(10, () => {
      test.gl.bindFramebuffer(0x8d40, {})
      test.gl.drawElements(4, 55296)
      test.gl.bindFramebuffer(0x8ca9, null)
      test.gl.drawElements(4, 123)
      test.gl.drawElements(1, 55296)
      test.canvas.testid = 'other-canvas'
      test.gl.drawElements(4, 55296)
      test.canvas.testid = 'glass-object-canvas'
    })
    test.time(1000)
    const result = test.probe.finish()
    expect(result.submittedFrames).toBe(0)
    expect(result.submittedFramesPerSecond).toBe(0)
    expect(result.submittedFrameIntervals.medianIntervalMs).toBeNull()
    expect(result.submittedFrameIntervals.p95IntervalMs).toBeNull()
    expect(result.status).toBe('insufficient-submitted-frames')
    test.probe.dispose()
  })

  it('keeps WebGL2 read-framebuffer binding separate and includes real panel array draws', () => {
    const test = environment('panel')
    test.probe.start('panel')
    test.frame(10, () => {
      test.gl.bindFramebuffer(0x8ca8, {}) // READ_FRAMEBUFFER does not redirect the draw target.
      test.gl.drawArrays(4, 0, 13860)
      test.gl.drawElementsInstanced(4, 13860, 0, 0, 0)
    })
    test.time(1000)
    const result = test.probe.finish()
    expect(result.submittedFrames).toBe(1)
    expect(result.submittedFrameIntervals.intervalSamples).toBe(0)
    expect(result.submittedFrameIntervals.medianIntervalMs).toBeNull()
    expect(result.status).toBe('insufficient-submitted-frames')
    test.probe.dispose()
  })

  it('never turns rAF-only callbacks into a fake frame rate', () => {
    const test = environment()
    test.probe.start('torus')
    for (let frame = 1; frame <= 60; frame += 1) test.frame(frame * 16)
    test.time(1000)
    const result = test.probe.finish()
    expect(result.observedRafCallbacks.samples).toBe(60)
    expect(result.submittedFrames).toBe(0)
    expect(result.submittedFramesPerSecond).toBe(0)
    test.probe.dispose()
  })

  it('reports interruptions rather than passing a reduced-motion or hidden run', () => {
    const test = environment()
    test.probe.start('torus')
    test.frame(10, () => test.gl.drawElements(4, 55296))
    test.win.document.visibilityState = 'hidden'
    test.win.document.dispatchEvent(new Event('visibilitychange'))
    test.motion.matches = true
    test.motion.dispatchEvent(new Event('change'))
    test.time(1000)
    const result = test.probe.finish()
    expect(result.status).toBe('paused-or-interrupted')
    expect(result.reasons).toContain('document-hidden')
    expect(result.reasons).toContain('reduced-motion-or-preference-unavailable')
    test.probe.dispose()
  })

  it('restores WebGL/canvas/rAF methods and makes disposal idempotent', () => {
    const test = environment()
    test.probe.start('torus')
    test.probe.dispose()
    test.probe.dispose()
    expect(test.win.requestAnimationFrame).toBe(test.originalRaf)
    expect(test.win.HTMLCanvasElement.prototype.getContext).toBe(test.originalGetContext)
    expect(test.gl.drawElements).toBe(test.originalDraw)
    test.frame(10, () => test.gl.drawElements(4, 55296))
    expect(test.probe.snapshot().draws.torus).toBe(0)
    expect(() => test.probe.start('torus')).toThrow('Probe disposed')
  })
})
