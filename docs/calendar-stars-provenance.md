# Calendar star background: provenance and integration

This change ports the star scene from [`interfacethegreatest/Calendar4`](https://github.com/interfacethegreatest/Calendar4) at revision [`7b7e533e587d4991c97b63259355d1a5e9141616`](https://github.com/interfacethegreatest/Calendar4/commit/7b7e533e587d4991c97b63259355d1a5e9141616). The pinned source files are:

- [`Model.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/backgrounds/starsBackground/Model.tsx)
- [`Scene.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/backgrounds/starsBackground/Scene.tsx)

The local copies were reviewed to establish the settings below. See [the port plan](calendar-stars-plan.md) for requirements, ownership, and acceptance criteria.

## Original rendered scene

| Element | Source setting to preserve |
| --- | --- |
| Canvas | No explicit camera configuration; retain the library's default camera. |
| Backdrop | Black, supplied by the calendar page styling. |
| Stars | Drei `Stars`, `radius={200}`, `count={7500}`, `factor={4}`, `fade`, and `color="red"`. Other star properties are omitted in the source. |
| Rotation | Each animation frame executes `rotation.x = rotation.y += 0.00025`: increment y, then assign that result to x. This is a per-frame increment, not a delta-time rate. |
| Ambient light | Intensity `1`. |
| Directional light | Intensity `3`, position `[0, 3, 2]`. |
| Environment | Drei `Environment` with `preset="city"`. |
| Postprocessing | `EffectComposer` containing `Bloom` with `mipmapBlur` and `luminanceThreshold={1}`; other properties use library defaults. |
| Shooting star | Defined in the source, but its JSX invocation is commented out. It is not part of the rendered scene and must remain disabled. |

The `color="red"` prop is a source-code detail, not evidence that the `Stars` shader produces visibly red stars. Preserve it where compatible without changing the shader or adding an effect to force that appearance. The source does not seed the star distribution, so a new randomized arrangement is not itself a fidelity failure.

## Compatibility and local environment asset

The source application uses React 18 and Three.js `0.167.1`; First Light uses React 19. React Three Fiber, Drei, and React Three Postprocessing therefore use compatible React 19 versions instead of the source's React 18 dependency versions. Three.js remains pinned to `0.167.1`. The resolved scene dependencies are Fiber `9.8.2`, Drei `10.7.9`, React Three Postprocessing `3.2.2`, and Postprocessing `6.36.0`; `npm ls` confirms compatible peer dependencies and a shared Three.js instance. Typed refs and React-compatible signatures are integration changes, with the normal scene parameters preserved.

Bundle the same city environment asset as the Drei preset: `potsdamer_platz_1k.hdr` from [`pmndrs/drei-assets/hdri`](https://github.com/pmndrs/drei-assets/tree/master/hdri). The target local path is `public/environments/potsdamer_platz_1k.hdr`. Resolve its runtime URL through Vite's configured base so a GitHub Pages subpath loads it from the app's own origin instead of the preset's remote CDN.

The bundled HDR was downloaded from [the exact revision used by Drei's environment loader](https://github.com/pmndrs/drei-assets/blob/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/potsdamer_platz_1k.hdr): `456060a26bbeb8fdf79326f224b6d99b8bcce736`. The preset mapping was checked in the installed Drei package: `city` resolves to this filename. The file is 1,540,678 bytes; SHA-256 is `7afe4c2f9700ee78c7477c53fa355463d7dda1fdede401432d6b5f9ff0a95696`. The production copy has the same hash.

## Host integration

The original canvas uses absolute page placement. First Light needs a fixed, full-viewport decorative layer behind its scrolling research interface. Keep that layer noninteractive and excluded from keyboard and screen-reader navigation. Load the renderer separately so the research interface remains usable while it loads. Use readable dark translucent panels over the black backdrop. These changes adapt the scene to its host without adding stars, lights, or animation effects.

Honor reduced-motion preferences by stopping the scene's rotation while retaining a usable static background. If WebGL or renderer loading fails, show the black fallback and keep the interface usable. Source, decision, status, browser persistence, and export behavior remain within the existing research workspace boundary.

The current host adaptation advances y by `0.015 * delta` radians, then assigns the result to x. Delta is elapsed seconds, so the rotation has the same speed at different frame rates while preserving the original source pace at 60 FPS (`0.00025 * 60`). The table above and initial verification below describe the original per-frame source implementation.

## Verification record

Verified locally on 2026-11-09:

- An independent source review confirmed the normal scene settings, disabled shooting star, and exact frame-based rotation match the pinned snapshots.
- `VITE_BASE_PATH=/first-light/ npm run check` passed TypeScript, all 34 tests (including six new fallback/motion tests), and the production build.
- Chromium `156.0.8078.79` rendered the production build with software WebGL. Test-only draw-call observation confirmed 7,500-point draws; an actual framebuffer readback contained 2,839 lit pixels at 1440 × 1000, with no GL error. No production instrumentation was added.
- The local environment request beneath `/first-light/environments/` returned HTTP 200. Normal rendering produced no application JavaScript errors.
- Source → decision → status → reload → JSON download passed while the background rendered. The layer and canvas have `pointer-events: none`, and the layer is `aria-hidden` with no focusable controls.
- Widths 1440, 768, 390, and 320 pixels showed no horizontal page overflow. Desktop and mobile screenshots were reviewed.
- Reduced-motion rendering stopped continuous draws and resumed when the preference changed. Tests disabling WebGL or aborting the lazy renderer chunk kept the research forms functional with the black fallback.

Review previews: [desktop](previews/calendar-stars-desktop.png) and [mobile](previews/calendar-stars-mobile.png). The mobile screenshot includes explicitly synthetic verification records; these are not seeded in the application.

The scene is loaded separately from the research interface. The added renderer chunk is about 274 KiB gzipped, plus the 1.54 MB local HDR asset. Rendering cost varies by device; this verification used software WebGL, not a survey of mobile GPUs. The star distribution is randomized, as in the original. Reduced motion and no-WebGL fallbacks intentionally adapt the normal animated scene for those browser conditions.

## Published verification

The user explicitly approved publication after reviewing the prepared change. [PR #2](https://github.com/interfacethegreatest/first-light/pull/2) was merged as `7848b1cd415255fb8cb4e47b2f9aeffc64570be0`. [Pages workflow 42620982549](https://github.com/interfacethegreatest/first-light/actions/runs/42620982549) successfully checked, built, and deployed that merge on 2026-11-09.

Live application: <https://interfacethegreatest.github.io/first-light/>.

An independent verification confirmed HTTP 200 for the live HTML, entry JavaScript, stylesheet, favicon, and referenced `StarBackground-CqT9_Edv.js` renderer chunk. The deployed HDR had the same 1,540,678 bytes and SHA-256 recorded above. All assets resolve beneath `/first-light/`.

The coordinator then exercised the actual HTTPS site in Chromium with software WebGL: 7,500-point draws, a framebuffer readback with 2,298 lit pixels and no GL error, HTTP 200 for the same-origin HDR, noninteractive decorative layering, source → decision → status → reload → export, and layouts at 1440/768/390/320 pixels. All passed with no application JavaScript errors. Star positions are randomized, so the live and local lit-pixel counts need not match. Test records remained in isolated browser contexts; no user records were uploaded or modified.

Later documentation-only commits do not trigger another deployment because the Pages workflow is manual. The rendering and device-performance limitations described above still apply.
