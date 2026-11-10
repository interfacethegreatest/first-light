# Build reusable transmission scenes for First Light

Implement two production-ready glass cards using the existing React 19, Fiber 9.8.2, Drei 10.7.9 and Three.js 0.167.1 installation. Inspect installed APIs and retain these versions; add no dependencies. Deliver complete typed source files without omitted sections. Preserve the main application's content, controls, styles and routes.

Create the components under `src/components/transmission/`: `RoundedTransmissionCard`, `CinematicTransmissionCard`, `TransmissionGallery`, and reusable material, sphere, torus and extruded-text helpers. Append TransmissionGallery to the existing [GlassPanelExample](../src/components/glass-panel-3d/GlassPanelExample.tsx), retaining its existing demonstrations and native drafts. Reuse its [example entry](../examples/glass-panel-3d/main.tsx); do not create a new application route or MPA entry.

## Composition and geometry

RoundedTransmissionCard presents a rounded glass box with bold extruded typography. CinematicTransmissionCard combines a glass sphere and torus with that typography. Inside each card, refracting objects and their target text must share one Three.js scene and renderer. Native headings provide accessible content, but HTML overlays and separate canvases cannot supply the required refracted text.

Use sphere geometry with **128 width segments and 96 height segments**. Use torus geometry with **48 radial segments and 192 tubular segments**. Retain these segment counts across quality profiles; scale rendering cost through buffers and sampling. Fit camera/framing responsively without cropping text or introducing page overflow.

Support explicit **behind**, **inside** and **intersecting** text placements. Behind placement should clearly demonstrate refraction; intersecting placement intentionally exposes overlapping geometry. Use real Drei Text3D with bold typeface data, extrusion and modest beveling, following the installed API. Default text to a readable solid material; provide optional glass text with one material per mesh.

## Exact optical starting values

Use MeshTransmissionMaterial with these defaults. Add concise code comments explaining the optical effect and cost, rather than repeating the property name.

| Property | Default | Comment intent |
| --- | --- | --- |
| `transmission` | `1` | Fully transmissive starting point |
| `thickness` | `0.85` | Optical depth through the object |
| `roughness` | `0.08` | Surface softness |
| `ior` | `1.4` | Refraction strength |
| `chromaticAberration` | `0.04` | Colour-channel dispersion |
| `anisotropicBlur` | `0.2` | Directional transmission softness |
| `distortion` | `0.2` | Distortion amplitude |
| `distortionScale` | `0.3` | Distortion spatial scale |
| `temporalDistortion` | `0.1` | Time-varying distortion |
| `backside` | `true` | Additional back-face capture |
| `backsideThickness` | `0.3` | Back-face optical thickness |
| `samples` | `6` | Transmission sample budget |
| `resolution` | `512` | Offscreen capture size |
| `color` | `#e8f4ff` | Pale cool tint |

Expose useful material sliders with bounded ranges, including transmission 0–1 for the optical comparison (default 1), thickness 0.2–1.5, roughness 0–0.25, IOR 1.1–1.8, chromatic aberration 0–0.1, anisotropic blur/distortion 0–0.5, distortion scale 0.05–1 and temporal distortion 0–0.2. Confirm prop spelling against installed Drei types.

Never attach MeshWobbleMaterial alongside MeshTransmissionMaterial or use a material array to combine them. Use Float/group transforms for motion. Actual vertex deformation, if required, must be integrated into one compatible shader and evaluated with its transmission capture.

## Quality, assets and renderer

Desktop defaults use **6 samples, 512 resolution, backside enabled and DPR capped at 1.75**. Balanced/mobile uses **4 samples, 256 resolution, backside disabled and DPR capped at 1.25**. Keep geometry identical. Describe the additional passes, memory and quality differences. Reserve 10 samples/1024 resolution for a future explicit quality option, not automatic allocation.

Verify the compiled shader changes when sample count changes, rather than checking native UI state alone. In the installed implementation the sample count is interpolated into GLSL; use a sample-specific `customProgramCacheKey` to prevent Three.js reusing a shader compiled for another quality setting.

Reuse the existing self-hosted [HDR](../public/environments/potsdamer_platz_1k.hdr) and [bold font](../public/fonts/helvetiker_bold.typeface.json):

```ts
`${import.meta.env.BASE_URL}environments/potsdamer_platz_1k.hdr`
`${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`
```

Retain the font's [MAGENTA/MgOpen license](../public/fonts/LICENSE-helvetiker.txt). Use no remote presets, fonts, decoders or asset substitutions. Illuminate with the local environment and local lights; keep its visible background optional. Configure antialiasing, ACESFilmicToneMapping, sRGB output and documented exposure using current Three.js properties. Add restrained contact shadows with bounded resolution and finite capture when stationary.

Prefer Drei's automatic transmission capture. If sharing or manually managing buffers, prevent sampling a target while writing to it, define visibility/self-exclusion for each pass, and restore render target, viewport, background, visibility and tone-mapping state afterward. Dispose owned resources without disposing shared loader-cache assets. Optional dual-transmission scenes remain approximate and capture-order-dependent; do not describe them as recursive physical refraction.

## Controls and lifecycle

Provide labeled native controls outside the decorative Canvas for text, placement, material mode, quality and motion. Keep their values, focus and DOM identity through loading or renderer failure. No Leva dependency is needed; it can remain a future integration option.

Mount rendering when visible. Pause autonomous motion while offscreen, page-hidden, reduced-motion or focused within controls. Use demand rendering while stationary and invalidate only when needed. Stop Float's automatic invalidation and temporal updates when paused; switching frameloop alone does not stop another helper requesting frames.

Prefer OrbitControls with damping disabled, zoom/pan disabled and demand updates. If damping is retained, allow only the finite settling frames it needs. Preserve mobile touch scrolling: disable orbit dragging on coarse pointers if necessary, and avoid forcing page-wide `touch-action:none`.

Clean up observers, media listeners, controls, materials and owned FBOs. Guard callbacks from obsolete/unmounted renderers. Add an error boundary and context-loss fallback with readable native text and stable dimensions. Missing WebGL, font/HDR failures and lazy-chunk errors must leave controls usable.

## Acceptance and delivery

Run relevant type checks, meaningful lifecycle/control tests and a production build. Verify quality changes, cleanup, reduced motion, focus/value preservation and asset/context failure paths without writing tests that merely repeat constants.

Use a real browser at desktop and narrow mobile widths. Confirm actual sphere, torus and extruded text, uncropped framing, local root/Pages asset requests and keyboard/touch behavior. Check paused draw scheduling and multiple-card resource behavior.

Prove refraction with comparison screenshots: identical behind-glass text or a contrasting scene marker with transmission enabled and disabled. Examine recognizable letter/marker deformation through the object. A loaded attribute, successful request or nonempty canvas alone is insufficient evidence.

Return complete components, integration changes, parameter/profile notes, executed commands, observed results, screenshots and remaining limits. Distinguish mocked tests, isolated GPU diagnostics and real-time browser evidence. Identify unfinished checks. Deploy only with user approval, honoring approval already recorded for the active task.
