# HTML inside the glass scene

`HtmlGlassCard` adds a reusable scene containing actual native HTML positioned by Drei `Html`, a physical glass plate and a gently wobbling torus. It is now mounted on the main page in `App.tsx`, below the workspace panels at `#glass-workspace`. Its title uses `ThreeDHeading` with real bold Text3D; native HTML children supply the body copy. The isolated `/examples/glass-panel-3d/` page also retains its example. Workspace controls, storage, shared glass tokens, existing scenes and the original mount hook are retained. No packages were installed or upgraded. See [main-page integration](main-glass-heading.md) for current verification.

```tsx
import HtmlGlassCard from '../components/html-glass-card/HtmlGlassCard'

<HtmlGlassCard title="A little more depth." noteLabel="Idea draft" inputHeight={88}>
  <p>Use this temporary space to sketch your next idea.</p>
</HtmlGlassCard>
```

## Scene and motion

`HtmlGlassCanvas.tsx` uses `Html` with `center`, `transform` and `occlude`. Its position is in front of the glass plate, so the plate does not hide the form. With orthographic zoom 100, `distanceFactor={400 / 100}` keeps native text at its intended CSS size. A persistent content host is mounted inside the Html slot. An explicit, stable DOM portal keeps this slot independent of changes to Fiber's event target. The actual canvas alone is decorative and blended; the Html DOM ancestors retain native accessibility, interaction and full opacity.

The torus uses `MeshWobbleMaterial` with factor 0.08 and speed 0.45. It is separate from the physical glass material, so the glass keeps its transmission and tint. Drei updates the wobble using elapsed scene time. The form and glass plate stay stationary. The canvas renders continuously only while visible, page-visible, not reduced-motion and not focused inside the form; all other states use demand rendering. Observers/listeners and the owned wobble material are cleaned up. The checked-in HDR is reused without a remote environment preset.

## Calendar4 extraction

The source is [Calendar4 ModalInput.tsx](https://github.com/interfacethegreatest/Calendar4/blob/main/src/components/input/ModalInput/ModalInput.tsx), blob `a8c5104262ef6cd1c8ae772ee38247a2c4a1bd18`.

`ModalInputContainer.tsx` extracts the requested wrapper rather than copying the original form/auth/font/label/counter code. It preserves the `clicked ? error ? …` ID ternary, internal ref, click activation and truthy `height ? px : undefined` expression. Keyboard focus also activates it. The three container CSS blocks are copied verbatim from `ModalInput.module.css`, blob `bf1d9eb5808f1914e62fe67a02b85a5d380befa2`: idle gray 1px border, active green 2px border and active/error red 2px border, with the original black background, 90% width, 6px radius and spacing.

The required `src/components/input/outsideClick.tsx` is present and used:

```tsx
import useOutsideClick from '../outsideClick'

const unclickContent = useCallback(() => {
  if (text.trim() === '') setClicked(false)
}, [text])
useOutsideClick(ref, unclickContent)
```

It adapts Calendar4's outside-click helper, blob `f147b4208995724f1154f6827a1acfd9b65e6c72`, with typed targets and a conventional hook name. It ignores events inside the ref, listens to document `mousedown`/`touchstart`, and removes both listeners on cleanup. Filled notes keep their active state when clicking elsewhere; empty or whitespace-only notes return to idle. The example's error toggle supplies the existing error branch.

## Native fallback

One React portal owns the HTML content throughout the component's lifetime. `moveHtmlHost` moves that same DOM host between the native fallback slot and Drei Html's scene slot, preserving field nodes, draft values and focus/selection. Context loss, missing WebGL, renderer/import/HDR failures retain usable HTML rather than a second form. The wrapper also remembers focus across Html's teardown ordering. The CSS supplies DOM backdrop blur; Three.js does not refract native HTML.

## Verification

The two new test files add 11 cases for the actual input wrapper/outside-click hook, native portal moves, focus/draft/selection preservation, readiness/failure handling, activity gating and cleanup. Only the GPU boundary is mocked in unit tests. All 160 tests across 18 files pass after the stable-portal correction. TypeScript, the `/first-light/` application production build and the isolated example production build pass. The active application's JS/CSS hashes remain `index-r8Z0IJLl.js`, `index-BQct1Xpe.css` and `FooterTextCanvas-D39cuvoH.js`, confirming this task adds no current-page runtime change. Vite's existing large-chunk advisory remains; there is no lint script.

The [browser report](html-glass-browser-verification.json) verifies actual Drei Html ancestry, one native field/host, accessible control semantics, local HDR loading and genuine shader-time/draw progression with a stationary form. Focus, reduced motion, offscreen visibility and a controlled hidden-document signal stop continuous draws after settling. The Calendar4 green/red borders, 88px height and outside-click behavior work in the real scene. Native WebGL context loss preserves the same host/field, draft, focus and selection in the fallback. Three fresh normal-motion contexts passed without losing the form. The explicit stable Html portal prevents the intermittent default-target recreation found during browser testing.

The [desktop](previews/html-glass-card-desktop.png) and [mobile](previews/html-glass-card-mobile.png) images show the actual isolated scene at rest for readable screenshots; motion was verified separately in the live renderer. This is Chromium with software WebGL. Safari, native tab minimization and hardware GPU performance remain unverified. Initial unavailable-WebGL and thrown-renderer fallback are covered by unit tests; separate browser asset-404/null-context fixtures were not run for this scene. No deployment or commit was made.
