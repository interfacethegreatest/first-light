# Isolated glass objects

Main-page integration: the [main-page guide](main-page-glass-objects.md) records the additional two-card placement, user-selected optical settings, main-only lighting/tint and rotating footer. The standalone example and its defaults remain available; the original scope and verification below describe that initial implementation.

The isolated-object design provides a rotating glass torus and a blank glass panel as reusable React Three Fiber objects. Native cards supply presentation and controls around them. This separates the object, scene host and HTML interface so a mesh can be reused without copying an entire demonstration.

This document records requirements, architecture and acceptance criteria. Observed runtime results belong in the verification section after coordinator review; source descriptions alone do not establish a passed browser check or deployment.

## Requirements and boundaries

- The torus and panel each contain one visible mesh using the existing transmission material. The panel is blank.
- The clean Canvas contains that one mesh, lights and a local environment. It adds no Text3D, Html annotation, floor, contact shadows, decorative spheres, bars or supporting geometry.
- Native headers and accessible controls stay outside the Canvas. Controls cover Spin, axis, speed, quality and optical settings; there are no lettering, text-placement or glass-text controls.
- Reuse the current material implementation, shared procedural studio environment, activity gates and installed dependencies. Use no photographic environment map and create no duplicate shader implementation.
- Add the single-selection gallery to the existing optional example at `#glass-objects`, above the older TransmissionGallery. The initial object is the torus.
- Keep the main application and older complex examples' content, controls and geometry intact. The coordinator's CSS hides older `.transmission-annotation` visual tags; native headings remain. The isolated and complex transmission scenes use the new nonphotographic studio environment.
- Preserve reduced-motion behavior, touch scrolling, focus and control values. Stop autonomous drawing while inactive, paused or at zero spin speed.

The source objects intentionally differ from the earlier multi-object transmission demonstrations. Their purpose is a reusable isolated shape, rather than text-refraction comparisons or a complete cinematic arrangement.

## Ownership and architecture

| File | Responsibility |
| --- | --- |
| [glassObjectTypes.ts](../src/components/glass-objects/glassObjectTypes.ts) | Typed object rotation, settings and mesh-facing contracts. |
| [useObjectRotation.ts](../src/components/glass-objects/useObjectRotation.ts) | Time-based axis rotation for an object's own ref. |
| [GlassTorusObject.tsx](../src/components/glass-objects/GlassTorusObject.tsx) | The isolated torus using the existing dense torus geometry/material. |
| [GlassPanelObject.tsx](../src/components/glass-objects/GlassPanelObject.tsx) | One rounded-box mesh with the same transmission surface. |
| [glassObjectSceneTypes.ts](../src/components/glass-objects/glassObjectSceneTypes.ts) | The scene host's typed data and lifecycle callbacks. |
| [GlassObjectCanvas.tsx](../src/components/glass-objects/GlassObjectCanvas.tsx) | Camera fitting, renderer, environment, lights and exactly one selected object. |
| [GlassObjectCards.tsx](../src/components/glass-objects/GlassObjectCards.tsx) | GlassTorusCard, GlassPanelCard and the single-selection GlassObjectGallery. |
| [GlassObjectCards.css](../src/components/glass-objects/GlassObjectCards.css) | Scoped native card layout, stage and controls. |

The material and dense torus remain canonical exports of [GlassPrimitives.tsx](../src/components/transmission/GlassPrimitives.tsx). Scene activity comes from [useTransmissionActivity.ts](../src/components/transmission/useTransmissionActivity.ts). [GlassStudioEnvironment.tsx](../src/components/transmission/GlassStudioEnvironment.tsx) provides the shared nonphotographic environment.

The object components belong inside an existing Canvas. They do not create a renderer, fetch an environment, add a GUI or manufacture a second scene. The full cards provide those hosting responsibilities when an application wants a ready-to-use DOM component.

## Geometry and rotation contract

The torus reuses the existing geometry: radius `1`, tube radius `0.34`, `48` radial segments and `192` tubular segments. Its default object scale is `1.35`.

The blank panel uses one RoundedBox with dimensions `4.8 × 3 × 0.42` and corner radius `0.18`. It does not contain text, a second object or a shadow-catching floor.

Default rotation is enabled, around `y`, at `0.3` radians per second. Speed is an angular velocity, not an increment per rendered frame: elapsed seconds determine the rotation change. Each instance owns its rotation reference so changing one object does not rotate every mounted instance.

The full-card host combines the user's Spin selection with activity, reduced-motion and focus conditions. A selected speed of zero is stationary and must use demand scheduling. The original Spin selection and optical values should survive a temporary pause.

The rotation hook skips the first frame after an inactive-to-active transition, because demand rendering can report the entire idle interval as that frame's delta. Subsequent finite, nonnegative deltas are used without clamping. A negative speed reverses direction; an invalid/nonfinite speed disables rotation. Each axis selects an Euler rotation component on the owned inner group. Caller position, rotation, scale and refs remain on the outer group.

## Public object and card props

| Boundary | Actual public props |
| --- | --- |
| Both objects (`ObjectProps`, also aliased as `GlassObjectProps`) | Optional `settings: GlassSettings`, `spin`, `rotationAxis: 'x' \| 'y' \| 'z'`, `rotationSpeed`, `onRendered`, and native R3F group props other than children/group `onAfterRender`. |
| GlassPanelObject (`PanelProps`) | The above plus optional `size: [width, height, depth]` and `radius`. |
| GlassTorusCard / GlassPanelCard (`GlassObjectCardProps`) | Optional `title`, native header `children`, `initialSpin`, `initialRotationAxis`, `initialRotationSpeed`, `initialMaterial: Partial<GlassSettings>` and `lightingIntensity` (light multiplier, default `1`). |
| GlassObjectGallery | No props; one native selector defaults to the torus. |

The object rotation options default to `spin=true`, `rotationAxis='y'` and `rotationSpeed=0.3`. Passing a custom `settings` object to a mesh requires a complete GlassSettings value; spread DEFAULT_GLASS_SETTINGS when overriding selected fields. A card's `initialMaterial` is partial and merged into those defaults. Its quality selector owns effective samples, resolution and backside settings.

`onRendered` is a mesh draw callback for scene owners. A host that uses it for readiness should exclude offscreen transmission-capture passes. The bundled Canvas reports readiness from the actual main-camera draw and records the visible main-scene mesh count.

## Transmission and environment

Settings are optional at the object boundary and fall back to `DEFAULT_GLASS_SETTINGS`. The shared defaults are:

| Setting | Default |
| --- | --- |
| Transmission / thickness / roughness | `1` / `0.85` / `0.08` |
| IOR / chromatic aberration | `1.4` / `0.04` |
| Anisotropic blur / distortion | `0.2` / `0.2` |
| Distortion scale / temporal distortion | `0.3` / `0.1` |
| Backside / backside thickness | `true` / `0.3` |
| Samples / resolution / tint | `6` / `512` / `#e8f4ff` |

The existing TransmissionSurface owns the material and automatic capture. It uses one material per mesh and includes the sample-count-specific program cache key needed when switching capture quality. Reuse it instead of reproducing a partial list of shader props in each object.

Both isolated objects deliberately pass `animate={false}` to that material. Their motion comes from the rotation hook, while effective temporal distortion stays zero. The `0.1` value above is the shared settings default, not an additional animated effect in these isolated scenes.

The material's optical thickness is separate from the panel's geometric depth. Transmission carries light through the Three.js scene; CSS opacity is a different compositing operation. Environment reflections and highlights remain important on an isolated object with no supporting geometry behind it.

Photographic environment maps remain visible in material reflections even with `background={false}`. These transmission scenes omit the photographic map entirely. The shared studio environment captures four circular Lightformer lights offscreen with `Environment frames={1}`, resolution `128` and `background={false}`. It uses no room/city photograph, HDR file, font or model download for these procedural objects. Its virtual lighting scene is separate from the visible object scene; the main scene still contains exactly one mesh. Other older glass examples can retain their own environment requirements.

The brighter lighting update raises studio key/fill/rim intensities from `3/1.5/2` to `4.5/2.25/3` and adds a broad front light at `1.25`. Both scene hosts use ambient/key/rim/warm-point intensities of `0.7/3.5/4/16`, previously `0.5/2.5/3/12`. Material parameters, exposure, camera, geometry and scheduling remain unchanged.

Soft highlights and light bands can still reflect in glass; removing photographic content does not remove lighting. A lone object does not refract the surrounding DOM or pixels from another Canvas into its transmission buffer. The native title and controls therefore remain ordinary HTML, not refracted content.

The older cinematic composition retains its intentional 3D text and supporting meshes, which can still refract through its glass. The new isolated scenes omit those objects entirely.

## Use an object inside your Canvas

For a component directly under `src/`, a minimal host can be written as follows. It has one visible mesh; studio lighting is captured separately.

```tsx
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import GlassTorusObject from './components/glass-objects/GlassTorusObject'
import { GlassStudioEnvironment } from './components/transmission/GlassStudioEnvironment'

export function TorusScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} aria-hidden="true">
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={3.5} />
      <Suspense fallback={null}>
        <GlassStudioEnvironment />
        <GlassTorusObject spin rotationAxis="y" rotationSpeed={0.3} />
      </Suspense>
    </Canvas>
  )
}
```

Replace the object import/element with GlassPanelObject to host a blank panel. Its optional size/radius belong to geometry, not CSS. A caller using custom geometry or multiple objects owns camera fitting, activity gates and frame scheduling. This minimal snippet demonstrates composition; the full card supplies the bounded production host and native fallback.

## Use a complete native card

```tsx
import { GlassTorusCard, GlassPanelCard } from './components/glass-objects/GlassObjectCards'

<GlassTorusCard
  title="Glass torus"
  initialSpin
  initialRotationAxis="z"
  initialRotationSpeed={-0.2}
  initialMaterial={{ roughness: 0.1 }}
>
  <p>This is native header content outside the scene.</p>
</GlassTorusCard>

// An alternative independent card:
<GlassPanelCard initialSpin={false} />
```

Each standalone card owns its own renderer. Use `<GlassObjectGallery />` from the same module when one selected object is sufficient. The gallery changes its mesh while retaining the native controls and Canvas host; it does not mount both full cards simultaneously.

## Native cards and style reuse

Use GlassTorusCard or GlassPanelCard when the caller wants the complete native frame, scene stage, status/fallback presentation and controls. Use the object components when the caller already owns a Canvas and scene policy.

Keep the HTML styling modular: the frame owns its boundary and spacing, the header owns the title, the stage owns canvas dimensions, and the native fieldset owns labels and controls. Optical parameters belong to the material; card spacing and borders belong to CSS.

GlassObjectCards imports the existing GlassCards.css foundation and its small scoped GlassObjectCards.css additions. The shared `transmission-card`, `transmission-heading`, `transmission-stage`, `transmission-status` and `transmission-controls` classes retain the established native layout. The `glass-object-*` classes add object-specific scope and focus treatment without a second global theme.

The scoped card stylesheet can consume existing theme custom properties for borders, radius, text and tint. This avoids a second global theme or changes to existing panes. Preserve `min-width:0`, responsive field layout and a stable stage size so a long label or narrow viewport does not create page overflow.

A header is sufficient to identify an isolated object. Additional floating scene tags, debug readouts or text controls would add clutter and contradict this component's scope. The older complex gallery remains available separately for those demonstrations.

The native optical sliders are Transmission, Thickness, Refraction index, Chromatic aberration and Roughness. Quality selects Automatic, Balanced/mobile or High/desktop. High uses 6 samples/512 capture/backside enabled/DPR cap 1.75; Balanced uses 4/256/backside disabled/DPR cap 1.25. Automatic follows coarse-pointer detection. Spin, axis and speed stay independent of those optical settings.

The built-in controls fieldset pauses spin while focused. Retry/reset remounts the renderer while retaining these native values. There is no HDR/font cache to clear for the isolated scene; the new objects use procedural geometry and studio lighting.

## Activity and lifecycle acceptance

- Wait for a visible, page-visible and renderer-capable request before starting the scene.
- Use the shared activity hook for viewport, document visibility, reduced motion and coarse-pointer information.
- Pause spin while hidden, offscreen, reduced-motion or focused within the built-in controls. Temporal material motion is already disabled for these objects. Zero speed is also a pause.
- Use continuous frames only while actual motion is enabled; otherwise settle on demand.
- Preserve mobile scrolling and keep decorative layers out of keyboard navigation.
- Keep native controls usable during lazy loading, renderer errors and context loss. Ignore callbacks from obsolete scene instances and clean up observers/listeners and owned resources.
- Keep the selector and each card's scene policy outside the raw reusable mesh components. A caller hosting a mesh directly is responsible for its own lifecycle gates.

## Acceptance criteria and verification

The coordinator should append observed outcomes after implementation and integration checks:

1. Torus and panel render as real transmission meshes, one mesh per clean scene, with no 3D text, Html tags or supporting geometry.
2. Defaults, typed public props and the mesh/card usage examples match the actual exports.
3. Rotation uses elapsed seconds, independent instances and the selected axis; pause/resume and zero speed do not produce jumps or idle animation loops.
4. The gallery initially selects the torus and switches cleanly between objects at `#glass-objects` without changing older example controls or the main application.
5. Quality and optical changes use shared material/cache behavior, nonphotographic studio lighting and bounded rendering settings; these object scenes issue no HDR/font/model requests.
6. Native labels, keyboard editing, focus, reduced motion and narrow-width scrolling remain usable, without extra scene annotations.
7. Relevant type/behavior/build checks pass, and a real browser verifies geometry, rotation, still-frame scheduling, procedural environment capture and failure behavior.

## Local verification — 10 November 2026

### Brighter lighting and publication

The [matched lighting report](glass-lighting-browser-verification.json) passes against the production build. With fixed camera, pose, geometry, Balanced quality and viewport, the torus's sampled object-region mean luminance rises from 19.2545 to 30.8665; the panel's rises from 7.50195 to 55.9901. These are screenshot statistics for this fixed software-rendered view, not calibrated light output or a general performance result. See the [brighter torus](previews/glass-lighting-torus.png), [brighter panel](previews/glass-lighting-panel.png), [coarse-touch mobile panel](previews/glass-lighting-mobile.png) and [updated cinematic scene](previews/glass-lighting-cinematic.png). The matching baseline views are retained for the [torus](previews/glass-lighting-before-torus.png) and [panel](previews/glass-lighting-before-panel.png).

The lighting update also passes actual rotation followed by reduced-motion demand settling, a true coarse-touch 320px layout and the existing cinematic scene smoke. The clean object scenes issue no image/HDR/model/font requests and have no healthy page/console errors. All 210 application tests, strict TypeScript, 26 packer tests, zero-error/zero-warning Moon validation, the Pages-path production build and exact source catalog verification pass. The user explicitly approved deployment of this update through the existing manual Pages workflow.

### Initial isolated-object verification

The coordinator reviewed the separate object/rotation, documentation and verification handoffs before integration. The final source passes strict TypeScript and all 210 application tests across 23 files. Sixteen new rotation cases execute the hook against real Three.js Group/Euler values at 30/60/120 FPS, with signed speeds, each axis, pause/resume and irregular elapsed times. Seven native-card cases cover controls, readiness, quality, activity/focus gates, failures, retries and cleanup.

`VITE_BASE_PATH=/first-light/ npm run build` passes for the main page and the example. The existing Vite large-chunk advisory remains; no lint script is configured. Dependencies, lockfile, main application source, storage schema and original assets are unchanged. The exact component catalog/manifest/ZIP verifies against all 98 selected source files (47 component modules, 11 hooks and 4 templates).

The reviewed [browser report](glass-objects-browser-verification.json) is PASS. Actual main-camera draws confirm one visible mesh in each scene: 18,432 torus triangles and 4,620 rounded-panel triangles. GL model-matrix changes and rendered pixel differences demonstrate both objects rotating. A separate same-view transmission 1/0 comparison checks the real shader uniform and visible optical change. Zero speed, focus, reduced motion and offscreen states settle without continued draws. Context loss/retry retains the same native control node, value and focus.

The clean scenes issue no HDR, model or 3D-font requests and have no page/console errors. Emulated coarse-touch contexts at 390px and 320px select Automatic/Balanced, fit without horizontal overflow and preserve `touch-action: pan-y`. A viewport-only desktop resize initially kept fine-pointer OrbitControls, so that touch assertion was corrected to use a genuine coarse-pointer emulation; the original harness diagnostic is retained in the artifacts.

A separate [existing-scene smoke](glass-studio-legacy-verification.json) confirms the original cinematic sphere/torus/text composition draws with the same studio lighting, hidden real annotation and no HDR request. Its local bold font returns 200, the actual four-sample shader renders, GL/page/console errors remain zero and draws settle at 299→299. See the [updated cinematic capture](previews/glass-studio-cinematic.png).

See the actual [torus desktop](previews/glass-object-torus-desktop.png), [blank panel desktop](previews/glass-object-panel-desktop.png), [torus mobile](previews/glass-object-torus-mobile.png) and [panel mobile](previews/glass-object-panel-mobile.png) captures. The focused GPU fixture hides older unchanged examples to bound software rendering cost; its new meshes, studio environment and materials remain real. A separate unmodified-example DOM check confirms the older native examples and new gallery order. The main-page native smoke preserves three generated source cards, draft/metadata values, storage behavior and narrow-width fit while isolating unchanged GPU regions.

Verification uses Chromium/SwiftShader and emulated touch. It does not establish Safari, hardware-mobile performance, FPS or performance with many simultaneous scenes. Still screenshots and actual rotation evidence are supplied; no video is claimed. Publication was approved by the user; the [manual Pages workflow](https://github.com/interfacethegreatest/first-light/actions/workflows/pages.yml) records the deployment result.
