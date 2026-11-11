# Transparent glass canvas and reusable text

## Scope, architecture and acceptance

The user requested removing the displayed backdrop and reusing the exact transmission material on a new object/text. Rendering changes to existing app components are contained in `GlassObjectCanvas.tsx`; the text components, capture helper and styles are new. App, existing shared CSS, material, torus/panel geometry, rotation hook and dependency/lock files remain unchanged. The subsequent request to make the text more translucent and deploy authorizes publication: the main Vite build adds the typography HTML entry, and the source catalog includes its entry point and all new components.

The main canvas uses alpha compositing and a transparent clear. A scoped new CSS module releases its existing card stage from a solid fill. The existing camera and invisible procedural studio lights remain necessary for rendering. A new owned texture supplies neutral studio radiance **only during offscreen transmission captures**; the screen pass has a null scene background. This uses the material's existing captures, without adding a render pass or taking over the frame loop.

`CaptureStudioBackdrop` chains/restores the scene's render callback and previous background, disposes its texture and supports StrictMode effect reinstallation. In this bare canvas, offscreen render targets are transmission captures. Adding postprocessing or other same-scene offscreen cameras would require more specific target classification.

`GlassTextObject` is one centered, extruded Text3D mesh using the unchanged `TransmissionSurface` as its single material. It retains the existing elapsed-time rotation hook and forwards native group transforms/ref, a draw callback and optional measured bounds. `GlassTextScene` supplies a native accessible wrapper, loading/error fallback, adaptive quality, camera fitting and activity gates. Its canvas background is clear; no text is added to the existing main page.

Ownership: coordinator owns canvas integration, publication build configuration, documentation, snapshots and release. The interface agent owns only the text scene's optical preset until handoff. The verification agent owns temporary before/after and live browser scripts/artifacts. Source research is read-only. Integration follows handoff; tests/build precede browser checks. The user explicitly authorized deployment on 11 November 2026.

Acceptance: actual screen framebuffer corners have alpha zero, visible objects retain their geometry/material and normal alpha, and private capture buffers contain nonblack radiance. Existing native controls and motion gates remain usable. Demonstrate real TextGeometry with the same material, fit at desktop/mobile widths and retain native fallback when WebGL is unavailable. Run types, relevant/full application tests, main production build and the separate preview build. Check the existing-file diff boundary.

## Files and reuse

### Rounded lettering and original object preservation

The lettering uses a puffier geometry profile to echo the torus: size `0.8`, extrusion `0.2`, bevel thickness `0.1`, bevel size `0.06`, bevel offset `-0.03`, ten bevel segments, eighteen curve segments and `0.06` letter spacing. The negative offset narrows the flat cap while the rounded shoulders expand only `0.03` beyond the original outline. The measured `I` stem retains a positive cap width. This geometry is preserved by the later optical-preset update.

For clearer text-specific glass, `GlassTextScene` now explicitly uses transmission `1`, cool tint `#e5ebf3`, thickness `0.22`, IOR `1.45`, roughness `0.008`, chromatic aberration `0.015`, anisotropic blur `0.012`, distortion `0.01` and backside thickness `0.12`. Compared with the former `#cdd2d9`/`0.41`/`0.03` preset, this reduces tint absorption, optical travel and haze. Material/CSS opacity remain one. Caller material overrides and adaptive sample/buffer budgets retain their existing precedence. The shared `TransmissionSurface` implementation and the main torus/panel preset are unchanged.

Optical settings alone left too much broad white fill in the letter faces during the first visual comparison. The text therefore selects `backdrop="dark"` for its **private capture only**. `GlassObjectCanvas` forwards this existing choice to the capture helper; the main torus/panel explicitly retain their original neutral studio palette. The darker text capture reduces transmitted white fill while preserving the existing studio reflections and lighting. The displayed scene background remains null and the canvas clear remains alpha zero. No CSS opacity fade, extra visible mesh, background image, material implementation change or additional render pass is introduced.

The coordinator reviewed the actual [before](previews/glass-text-before-clarity.png), [final clearer LIGHT](previews/glass-text-clearer.png), [final clearer GLASS](previews/glass-word-clearer.png) and [390px result](previews/glass-text-clearer-mobile.png) captures. Geometry, camera and pose are held fixed; the final version is accepted after the optics-only intermediate still appeared too solid. The [final local report](translucent-text-verification.json) records the accepted desktop/mobile preset, real capture buffers, native editing and preserved main-page objects. The new lifecycle regression checks tone replacement and disposal without resurrecting a retired capture texture/callback. These are authored appearance adjustments, not a claim that arbitrary page HTML can be optically transmitted through the letters.

`GlassTextObject` owns a smoothed geometry clone. Because `TransmissionSurface` has no UV texture maps, the clone can discard UV/normal seams before welding positions and recomputing shared normals. Cleanup restores the original geometry when appropriate and disposes the clone on text changes/unmount. The original geometry remains owned by Drei/Fiber. This avoids relying on an unowned geometry replacement for smoothing.

`GlassObjectCanvas.tsx` explicitly sets its DOM background to transparent, enables renderer alpha and clears to alpha zero. Both existing “FIRST LIGHT / GLASS OBJECT” cards still mount their original torus/panel meshes through this shared canvas. Byte comparisons against the release commit confirm `GlassTorusObject.tsx`, `GlassPanelObject.tsx` and `GlassPrimitives.tsx` (including `TransmissionSurface`) are unchanged. Material implementation and original mesh geometry are preserved.

Rounded lettering increases geometry work; the existing material quality budgets, demand rendering and activity gates remain. Physical Safari/device performance is not established by Linux software-renderer checks.

The [rounded-letter preview](previews/bubbly-glass-text.png) and [original cards with transparent canvases](previews/original-glass-cards-transparent.png) were reviewed after the geometry change, before the final clearer text preset. The [browser report](bubbly-glass-verification.json) passes for desktop and true coarse-pointer 390px contexts. `LIGHT`, `GLASS` and the 20-character `BUBBLY GLASS OBJECTS` fit; measured outline gaps remain positive and intended counters remain present. Both native text edits dispose the old owned geometry while retaining the canvas and material identities. The original torus/panel still have their original geometry counts and optical uniforms; displayed backgrounds and corner/hole alpha are clear, captures remain valid and native controls remain present. All four healthy contexts report no page/console errors or warnings. Strict project/preview TypeScript, all 249 application tests and both production builds pass. No geometry-knob mirror tests or hardware-performance claim were added.

- [GlassObjectCanvas.tsx](../src/components/glass-objects/GlassObjectCanvas.tsx): transparent renderer and optional `renderObject`/`fitSize` API.
- [CaptureStudioBackdrop.tsx](../src/components/glass-objects/CaptureStudioBackdrop.tsx): capture-only background ownership.
- [GlassTextObject.tsx](../src/components/glass-objects/GlassTextObject.tsx): pure reusable mesh.
- [GlassTextScene.tsx](../src/components/glass-objects/GlassTextScene.tsx): drop-in native scene wrapper.
- [New preview](../examples/transparent-glass/main.tsx): mounts the text directly in the page, with no backdrop wrapper or decorative fill.

```tsx
import GlassTextScene from './components/glass-objects/GlassTextScene'

<GlassTextScene text="LIGHT" spin rotationSpeed={0.12} />
```

The preview has no checkerboard, image, gradient or backing panel around the object. The letters refract their private studio capture; page HTML is not sampled. Material opacity stays one. This establishes a floating 3D object, not optical refraction of arbitrary DOM content.

## Preview and verification

The existing Vite dev server serves `/examples/transparent-glass/`. A separate production preview build is available without editing the main build configuration:

```sh
./node_modules/.bin/tsc --project examples/transparent-glass/tsconfig.json
VITE_BASE_PATH=/first-light/ ./node_modules/.bin/vite build --config examples/transparent-glass/vite.config.ts
VITE_BASE_PATH=/first-light/ ./node_modules/.bin/vite preview --config examples/transparent-glass/vite.config.ts --port 4225
```

The optional separate preview build goes to `/workspace/artifacts/first-light-transparent-glass-preview/` in this checkout. The standard production build also includes `dist/examples/transparent-glass/index.html`, which publishes at `/first-light/examples/transparent-glass/` alongside the unchanged main page and existing component example.

Final release checks pass: strict project TypeScript, the new preview's separate strict TypeScript configuration, all **250 application tests across 31 files**, the three-entry Pages-base production build and the exact 110-file source catalog/ZIP. The five capture/canvas tests cover main/offscreen background selection, callback chaining/restoration, later-owner protection, StrictMode texture lifecycle, tone changes and disposal, camera fitting, custom mesh state and main-draw readiness. The existing large-chunk build advisory remains; dependencies are unchanged. The publication build adds the typography HTML entry. Desktop/coarse rendering and the accepted text before/after comparison pass; live publication is verified separately after the Pages workflow.

The coordinator reviewed actual [main desktop](previews/transparent-glass-main-desktop.png), [390px main](previews/transparent-glass-main-mobile.png) and [current clearer rounded text without a backdrop](previews/glass-text-clearer.png) screenshots. Real Chromium/SwiftShader checks establish:

- Both original objects retain one mesh, original geometry, colour and optical settings. Their actual canvas contexts have alpha enabled, screen backgrounds are null and corner pixels read `[0,0,0,0]`. Object pixels have nonzero alpha; the torus hole has zero alpha. Offscreen capture framebuffers remain complete/nonblack and use the owned 512px studio texture.
- A separately labelled red/blue DOM-background diagnostic changes pixels outside the geometry and through the torus hole. Normal screenshots retain the application's real DOM and GPU layers. The stage's computed background is transparent and reduced-motion demand rendering settles.
- True coarse-pointer/touch emulation at 390px renders both main objects without overflow. The new text is one actual TextGeometry with one transmission material, clear exterior pixels, a null displayed background and a nonblack capture. Editing `LIGHT` to `GLASS` preserves the renderer and native field; measured fitting and the initial oblique pose keep its extrusion visible. Adaptive quality uses the existing six/512px versus four/256px budgets.
- With WebGL constructors unavailable, the new text retains its native labelled fallback and editable preview field, with no canvas or page failure.
- An initial preview-only `/favicon.ico` 404 was traced to the new HTML entry lacking an icon link. The new entry now uses the existing `%BASE_URL%first-light.svg`. Fresh text checks report successful local font/icon loads and no page/console errors or warnings. Main checks were retained because their source and build did not change during that preview-only fix.

The first diagnostic preview used a CSS checkerboard to show canvas transparency. The user requested no visible backdrop, so that wrapper and its explanatory text have been removed. Earlier diagnostic evidence remains historical; the current preview mounts the glass scene directly on the page. The follow-up preview TypeScript/build and [desktop/390px browser checks](no-backdrop-preview-verification.json) pass: every ancestor between canvas and body has a transparent background and no background image, the text is a direct child of the page's main element, and the mesh remains visible and editable without overflow or healthy errors. Only the body's ordinary page colour remains. No mesh/material changes were needed.

The [earlier browser report](transparent-glass-verification.json) records the transparent-canvas implementation before publication. This is Linux software Chromium evidence, not physical Safari/GPU performance or a touch-swipe test. The glass body still samples virtual studio radiance; arbitrary DOM refraction is not implemented. The approved release must separately confirm the final text preset, successful Pages workflow and public typography route.
