# Transmission studies

Follow-up: both transmission compositions now use brighter procedural studio lights instead of the photographic HDR, and their floating scene tags are hidden. The new [isolated glass objects](isolated-glass-objects.md) guide covers those changes and the separate single-mesh torus/panel gallery. The release verification below records the earlier published implementation; the follow-up's current checks are recorded in that guide.

## Requirements and acceptance

Implement reusable higher-segment glass sphere/torus components, a RoundedBox transmission card, and a cinematic card combining those meshes with bold extruded typography in one scene. Preserve the main-page design, original glass examples, workspace records and earlier local changes. Use existing runtime versions and self-hosted assets; add no dependencies. The user has approved integration, testing and deployment in this turn.

Acceptance: both real scenes render at desktop and mobile widths; their text/scene markers visibly refract as transmission changes; native controls edit lettering, optical settings, text placement, solid/glass text, quality and motion. The sphere uses 128×96 segments, the torus 48×192. Motion pauses when offscreen, hidden, reduced or editing controls, with demand rendering otherwise. Native controls and values survive renderer failure and retry. Touch scrolling, local asset paths and existing main-page behavior remain usable. Run strict types, meaningful tests and production builds, and capture actual scenes before publishing.

## Architecture and ownership

- Interface agent: only `GlassPrimitives.tsx`, the typed material and dense geometry factories. Optical thickness is separate from geometry; one automatic transmission material per host mesh avoids material-array capture conflicts.
- Coordinator: native card wrapper/activity hook, shared scene types, lazy Canvas and both compositions, scoped CSS, example integration, code catalog, documentation, final checks and release.
- Documentation agent: only the self-contained [generation prompt](transmission-scenes-generation-prompt.md).
- Verification agent: only the transmission wrapper tests, temporary browser script and its artifacts. Browser verification follows renderer/build readiness. No overlapping edits.

The material API was handed off before the coordinator built the scenes. The gallery appends to the existing `GlassPanelExample` and selects one active Canvas. The original native glass panel and Drei Html example remain in that page. No new router or entry migration is needed. The direct `#transmission-studies` link scrolls once after React mounts the gallery.

## Components and parameters

`GlassCards.tsx` exports `RoundedTransmissionCard`, `CinematicTransmissionCard`, and `TransmissionGallery`. Both cards expose `title`, `initialText` and `children`. The native GUI stays outside the renderer boundary. `TransmissionCanvas.tsx` contains the rounded panel, combined sphere/torus composition, same-scene text, contrast markers, lights, local environment, contact shadows, annotation and optional pointer controls.

Desktop starts with transmission 1, thickness .85, roughness .08, IOR 1.4, chromatic aberration .04, anisotropic blur .2, distortion .2, distortion scale .3, temporal distortion .1, backside enabled, backside thickness .3, six samples, 512px buffers and `#e8f4ff` tint. Every material parameter is commented in the implementation. The high-quality DPR cap is 1.75. Balanced/mobile keeps the same topology but uses four samples, 256px buffers, no backside pass and DPR cap 1.25. Native controls select the profile explicitly; automatic selection uses the coarse-pointer query.

Text uses the existing Helvetiker Bold JSON, .28 extrusion and bevels, with one solid material by default. Optional glass lettering uses one lighter transmission material across the entire mesh. Behind, inside and intersecting placements are selectable, with an additional depth offset. Inside-mode text is conservatively fitted to the sphere using its measured diagonal. Other text is width-limited. `Html` supplies a native annotation clear of glass raycast occluders; it is not the text being refracted.

The environment is `environments/potsdamer_platz_1k.hdr` and font is `fonts/helvetiker_bold.typeface.json`, both beneath the Vite base URL. Existing asset licences remain unchanged. No remote presets, fonts, decoders, Leva, postprocessing dependency or manually managed transmission buffer are added.

The orthographic camera fits the stage dimensions. The renderer uses antialiasing, ACES filmic tone mapping and sRGB output. Desktop OrbitControls disable zoom, pan and damping and limit orbit angles. Coarse-pointer scenes omit those controls and retain vertical touch scrolling. Float self-invalidation is disabled and its enabled flag follows activity. Contact shadows execute only on scheduled frames. A finite invalidation allowance updates paused scenes after a user change; it does not guarantee recursive optical convergence.

## Limits

Multiple transmission materials use separate capture buffers; nested refraction is approximate and incurs extra whole-scene passes. Backside capture adds work. The material samples this scene's real meshes/text, not native DOM or other canvases. Demand rendering retains GPU contexts until unmount. No physical caustic solver, Boolean union of sphere/torus or combined vertex-wobble shader is claimed. Runtime appearance, software-rendering behavior and hardware performance require their own evidence.

## Verification and release

`VITE_BASE_PATH=/first-light/ npm run check` passes: 187 application tests across 21 files, 26 GLB packer tests, original/converted Moon validation with zero errors/warnings, strict TypeScript, and the multipage production build. Eight new behavioral cases cover deferred loading/readiness, native editing/variant continuity, quality, activity/focus gates, renderer failure/retry and cleanup. Dependency versions and workspace schema remain unchanged. Vite retains its large-chunk advisory; no lint script is configured.

The [actual browser report](transmission-browser-verification.json) is PASS. Real GPU calls confirm sphere index count 72,960 (24,320 triangles) and torus index count 55,296 (18,432 triangles), the bold font and local HDR. Same-view transmission 1/0 screenshots show optical changes in both compositions. Six-sample/512px desktop and four-sample/256px Balanced shader/buffer changes were inspected directly, rather than inferred from native controls. A sample-specific `customProgramCacheKey` fixes Drei/Three reusing the former program when quality changes.

Desktop rendering settles in demand mode, motion starts only when eligible and stops during editing. WebGL context loss retains the same native input, value and focus; explicit retry loads a new real scene. A separate deliberately injected font404 test restores the asset and retries: the font is fetched again successfully and the recovered scene draws while native state/focus survive. That fault intentionally emitted a JSON-parse error; no new page errors appeared after recovery. Asset-error retry clears only this scene's font/HDR loader keys, without disposing other scenes' resources. Context-only retry preserves successful caches. The example now declares the existing base-relative SVG favicon.

At 390px and 320px, real scenes and controls fit without horizontal overflow and coarse-pointer canvases retain `touch-action: pan-y`. The main-page native smoke retains the reference glass draft, the #top home action, three source sections from one activation, metadata drafts and export isolation. The original main workspace logic and storage files are unchanged.

See the [rounded panel](previews/transmission-panel-desktop.png), [cinematic composition](previews/transmission-cinematic-desktop.png), [mobile panel](previews/transmission-panel-mobile.png) and [mobile cinematic card](previews/transmission-cinematic-mobile.png). The verification fixture hides older unchanged demo GPU layers to bound software rendering cost; the new transmission meshes, text, materials and assets remain real. A separate coordinator capture also rendered the new panel with the original examples present.

Verification uses Chromium/SwiftShader. It does not establish Safari/mobile hardware performance, FPS or recursive optical correctness. The panel's inside placement centers the text within the slab; only cinematic sphere inside mode uses diagonal fitting to bound the complete word. The sourcebook/ZIP/manifest contain all 89 selected source files, including these components, and exact byte/hash checks pass.

The user has approved publishing the combined update: the reference main glass draft, three-section source batches, axis-spinning Moon and this gallery. The existing manual [Pages workflow](https://github.com/interfacethegreatest/first-light/actions/workflows/pages.yml) records deployment results. The public entry points are [the main workspace](https://interfacethegreatest.github.io/first-light/) and [transmission studies](https://interfacethegreatest.github.io/first-light/examples/glass-panel-3d/#transmission-studies).
