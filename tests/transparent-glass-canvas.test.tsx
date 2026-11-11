import { Children, StrictMode, Suspense, isValidElement, type Ref } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Canvas, type RootState } from '@react-three/fiber'
import { BoxGeometry, Color, Mesh, MeshStandardMaterial, OrthographicCamera, Scene, Texture, WebGLRenderTarget, type WebGLRenderer } from 'three'
import CaptureStudioBackdrop, { installCaptureBackdrop } from '../src/components/glass-objects/CaptureStudioBackdrop'
import GlassObjectCanvas, { type SceneObjectProps, type TransparentGlassCanvasProps } from '../src/components/glass-objects/GlassObjectCanvas'
import GlassTorusObject from '../src/components/glass-objects/GlassTorusObject'
import GlassPanelObject from '../src/components/glass-objects/GlassPanelObject'
import { DEFAULT_GLASS_SETTINGS } from '../src/components/transmission/GlassPrimitives'

const fiber = vi.hoisted(() => ({ state: null as RootState | null }))
vi.mock('@react-three/fiber', () => ({
  Canvas: vi.fn(),
  useThree: <T,>(selector: (state: RootState) => T) => selector(fiber.state!),
}))
vi.mock('@react-three/drei', () => ({ OrbitControls: () => null, MeshTransmissionMaterial: () => null }))
vi.mock('../src/components/transmission/GlassStudioEnvironment', () => ({ GlassStudioEnvironment: () => null }))
vi.mock('../src/components/glass-objects/GlassTorusObject', () => ({ default: vi.fn(() => null) }))
vi.mock('../src/components/glass-objects/GlassPanelObject', () => ({ default: vi.fn(() => null) }))

function environment() {
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 40)
  let target: WebGLRenderTarget | null = null
  const renderer = { getRenderTarget: () => target, domElement: document.createElement('canvas'), setClearColor: vi.fn() }
  const invalidate = vi.fn()
  fiber.state = { scene, camera, gl: renderer, size: { width: 640, height: 480 }, invalidate } as unknown as RootState
  return { scene, camera, renderer, invalidate, target(value: WebGLRenderTarget | null) { target = value } }
}
function renderPass(env: ReturnType<typeof environment>) {
  const args = [env.renderer, env.scene, env.camera, null] as unknown as Parameters<Scene['onBeforeRender']>
  env.scene.onBeforeRender(...args)
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
    createLinearGradient: () => ({ addColorStop: vi.fn() }), fillRect: vi.fn(), fillStyle: '',
  }) as unknown as CanvasRenderingContext2D)
  // Mount the actual ObjectScene and capture hook while replacing the renderer
  // and leaf meshes. Never mount Three intrinsics as HTML elements.
  vi.mocked(Canvas).mockImplementation(props => {
    const scene = Children.toArray(props.children).find(child => isValidElement(child) && child.type === Suspense)
    return <><canvas ref={(props as { ref?: Ref<HTMLCanvasElement> }).ref} data-testid="transparent-canvas-boundary" data-frameloop={props.frameloop} />{scene}</>
  })
})

describe('capture-only studio background ownership', () => {
  it('uses studio radiance only offscreen, chains the previous callback and restores its background and callback', () => {
    const env = environment(), original = new Color('#123456'), studio = new Texture()
    env.scene.background = original
    const previous = vi.fn(function (this: Scene, _renderer: WebGLRenderer) { this.background = new Color('#abcdef') })
    env.scene.onBeforeRender = previous
    const uninstall = installCaptureBackdrop(env.scene, studio)
    expect(env.scene.background).toBeNull()

    const target = new WebGLRenderTarget(256, 256)
    env.target(target);renderPass(env)
    expect(env.scene.background).toBe(studio)
    env.target(null);renderPass(env)
    expect(env.scene.background).toBeNull()
    expect(previous).toHaveBeenCalledTimes(2)
    expect(previous.mock.contexts).toEqual([env.scene, env.scene])
    expect(previous.mock.calls[0][0]).toBe(env.renderer)

    uninstall()
    expect(env.scene.onBeforeRender).toBe(previous)
    expect(env.scene.background).toBe(original)
    target.dispose();studio.dispose()
  })

  it('does not overwrite a later owner when its installation is cleaned up', () => {
    const env = environment(), studio = new Texture(), replacement = new Color('#f0f8ff')
    const uninstall = installCaptureBackdrop(env.scene, studio)
    const previousInstallation = env.scene.onBeforeRender
    const nextOwner = vi.fn()
    env.scene.onBeforeRender = nextOwner;env.scene.background = replacement
    uninstall()
    expect(env.scene.onBeforeRender).toBe(nextOwner)
    expect(env.scene.background).toBe(replacement)
    const target = new WebGLRenderTarget(256, 256)
    env.target(target)
    previousInstallation.call(env.scene, ...[env.renderer, env.scene, env.camera, target] as unknown as Parameters<Scene['onBeforeRender']>)
    expect(env.scene.background).toBe(replacement)
    expect(env.scene.onBeforeRender).toBe(nextOwner)
    target.dispose();studio.dispose()
  })

  it('retains a usable capture texture through StrictMode replay and disposes it while restoring the scene on unmount', () => {
    const env = environment(), original = new Color('#243040'), previous = vi.fn()
    env.scene.background = original;env.scene.onBeforeRender = previous
    const disposal = vi.spyOn(Texture.prototype, 'dispose')
    const view = render(<StrictMode><CaptureStudioBackdrop /></StrictMode>)
    const target = new WebGLRenderTarget(512, 512)
    env.target(target);renderPass(env)
    const usedTexture = env.scene.background as unknown as Texture
    expect(usedTexture.isTexture).toBe(true)
    expect(usedTexture.image).toBeInstanceOf(HTMLCanvasElement)
    expect(usedTexture.image.width).toBe(512);expect(usedTexture.image.height).toBe(512)
    expect(usedTexture.version).toBeGreaterThan(1)
    env.target(null);renderPass(env);expect(env.scene.background).toBeNull()

    view.unmount()

    expect(env.scene.background).toBe(original)
    expect(env.scene.onBeforeRender).toBe(previous)
    expect(disposal.mock.contexts).toContain(usedTexture)
    target.dispose()
  })

  it('replaces and disposes owned textures across tone changes without reusing retired capture hooks', () => {
    const env = environment(), original = new Color('#243040'), previous = vi.fn()
    env.scene.background = original;env.scene.onBeforeRender = previous
    const disposal = vi.spyOn(Texture.prototype, 'dispose')
    const disposeCount = (texture: Texture) => disposal.mock.contexts.filter(value => value === texture).length
    const target = new WebGLRenderTarget(256, 256)
    const view = render(<CaptureStudioBackdrop tone="neutral" />)

    env.target(target);renderPass(env)
    const first = env.scene.background as unknown as Texture
    const firstHook = env.scene.onBeforeRender
    expect(first.isTexture).toBe(true)
    expect(disposeCount(first)).toBe(0)
    env.target(null);renderPass(env)
    expect(env.scene.background).toBeNull()

    view.rerender(<CaptureStudioBackdrop tone="dark" />)
    expect(disposeCount(first)).toBe(1)
    expect(env.scene.background).toBeNull()
    env.target(target);renderPass(env)
    const dark = env.scene.background as unknown as Texture
    const darkHook = env.scene.onBeforeRender
    expect(dark.isTexture).toBe(true)
    expect(dark).not.toBe(first)
    expect(darkHook).not.toBe(firstHook)
    expect(disposeCount(dark)).toBe(0)
    const args = [env.renderer, env.scene, env.camera, null] as unknown as Parameters<Scene['onBeforeRender']>
    firstHook.call(env.scene, ...args)
    expect(env.scene.background).toBe(dark)
    expect(env.scene.onBeforeRender).toBe(darkHook)
    env.target(null);renderPass(env)
    expect(env.scene.background).toBeNull()

    view.rerender(<CaptureStudioBackdrop tone="neutral" />)
    expect(disposeCount(first)).toBe(1)
    expect(disposeCount(dark)).toBe(1)
    env.target(target);renderPass(env)
    const nextNeutral = env.scene.background as unknown as Texture
    const nextHook = env.scene.onBeforeRender
    expect(nextNeutral.isTexture).toBe(true)
    expect(nextNeutral).not.toBe(first)
    expect(nextNeutral).not.toBe(dark)
    expect(nextHook).not.toBe(firstHook)
    expect(nextHook).not.toBe(darkHook)
    expect(disposeCount(nextNeutral)).toBe(0)
    firstHook.call(env.scene, ...args);darkHook.call(env.scene, ...args)
    expect(env.scene.background).toBe(nextNeutral)
    expect(env.scene.onBeforeRender).toBe(nextHook)
    env.target(null);renderPass(env)
    expect(env.scene.background).toBeNull()

    view.unmount()
    expect(disposeCount(nextNeutral)).toBe(1)
    expect(env.scene.onBeforeRender).toBe(previous)
    expect(env.scene.background).toBe(original)
    nextHook.call(env.scene, ...args)
    expect(env.scene.onBeforeRender).toBe(previous)
    expect(env.scene.background).toBe(original)
    expect(previous).toHaveBeenCalled()
    target.dispose()
  })
})

describe('reusable transparent glass Canvas', () => {
  it('forwards custom object state, fits its camera and accepts readiness only from the matching main pass', () => {
    const env = environment(), onReady = vi.fn(), onUnavailable = vi.fn()
    const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());env.scene.add(mesh)
    const renderObject = vi.fn((_props: SceneObjectProps) => null)
    const props: TransparentGlassCanvasProps = {
      kind: 'torus', settings: DEFAULT_GLASS_SETTINGS, spin: false, rotationAxis: 'z', rotationSpeed: -0.2,
      interactive: false, coarse: true, high: false, fitSize: 8, renderObject, onReady, onUnavailable,
    }
    const view = render(<GlassObjectCanvas {...props} />)
    const canvas = screen.getByTestId('transparent-canvas-boundary')
    env.renderer.domElement = canvas as HTMLCanvasElement
    let configured = vi.mocked(Canvas).mock.calls.at(-1)![0]
    expect(configured.gl).toMatchObject({ alpha: true })
    act(() => configured.onCreated?.(fiber.state!))
    expect(env.renderer.setClearColor).toHaveBeenCalledWith(0x000000, 0)
    expect(canvas).toHaveAttribute('data-frameloop', 'demand')
    expect(env.camera.zoom).toBe(60)
    const forwarded = renderObject.mock.calls.at(-1)![0]
    expect(forwarded).toMatchObject({ settings: DEFAULT_GLASS_SETTINGS, spin: false, rotationAxis: 'z', rotationSpeed: -0.2 })
    expect(forwarded.settings).toBe(DEFAULT_GLASS_SETTINGS)
    expect(GlassTorusObject).not.toHaveBeenCalled();expect(GlassPanelObject).not.toHaveBeenCalled()
    const draw = (camera = env.camera) => forwarded.onRendered(...[
      env.renderer, env.scene, camera, mesh.geometry, mesh.material, null,
    ] as unknown as Parameters<SceneObjectProps['onRendered']>)
    const target = new WebGLRenderTarget(256, 256)
    env.target(target);act(() => draw());expect(onReady).not.toHaveBeenCalled()
    env.target(null);act(() => draw(new OrthographicCamera()));expect(onReady).not.toHaveBeenCalled()
    act(() => { draw();draw() })
    expect(onReady).toHaveBeenCalledOnce()
    expect(canvas).toHaveAttribute('data-glass-object-mesh-count', '1')
    expect(canvas).toHaveAttribute('data-glass-object-geometry', 'BoxGeometry')

    view.rerender(<GlassObjectCanvas {...props} fitSize={12} spin />)
    expect(screen.getByTestId('transparent-canvas-boundary')).toBe(canvas)
    expect(canvas).toHaveAttribute('data-frameloop', 'always')
    expect(env.camera.zoom).toBe(40)
    expect(renderObject.mock.calls.at(-1)![0].spin).toBe(true)
    configured = vi.mocked(Canvas).mock.calls.at(-1)![0]
    expect(configured.gl).toMatchObject({ alpha: true })
    view.rerender(<GlassObjectCanvas {...props} kind="panel" renderObject={undefined} />)
    expect(GlassPanelObject).toHaveBeenCalled()
    expect(screen.getByTestId('transparent-canvas-boundary')).toBe(canvas)
    view.unmount();target.dispose();mesh.geometry.dispose();(mesh.material as MeshStandardMaterial).dispose()
  })
})
