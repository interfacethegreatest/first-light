# Footer Text3D scene

One compact, reusable scene is mounted immediately before the existing site footer. It renders “Make learning tangible.” as extruded lettering. Existing paragraphs, glass panes, Moon/Sun scenes, backgrounds, footer contents and workspace controls stay in place; App.tsx changes only by adding an import and `<FooterTextScene />`.

The shared renderer now uses Helvetiker Bold with deeper extrusion and bevels, and also powers the reusable [ThreeDHeading](three-d-heading.md) inside the [main-page glass card](main-glass-heading.md). Verification and asset hashes below describe the original footer implementation; the main-page integration document records the current checks.

## Code and assets

- `FooterTextScene.tsx`: accessible HTML wrapper/fallback, lazy canvas loading, local error boundary and readiness state.
- `FooterTextCanvas.tsx`: transparent R3F canvas, local lights, `Text3D`, `Center`, `Float` and responsive orthographic fitting.
- `useFooterTextActivity.ts`: viewport, document visibility, reduced motion and WebGL availability with cleaned subscriptions.
- `FooterTextScene.module.css`: isolated 112px desktop/90px mobile scene, maximum width 660px, normal touch scrolling and no pointer interception.

Drei 10.7.9, Fiber 9.8.2, React 19.3.1 and Three 0.167.1 were already installed. No package or lockfile changes are needed. The installed Drei/three-stdlib version uses Text3D's `height` prop for extrusion.

The local font is `public/fonts/helvetiker_regular.typeface.json` (63,182 bytes), copied unchanged with its MAGENTA/MgOpen license. See [font provenance and hashes](footer-text-font.md). The runtime URL includes `import.meta.env.BASE_URL`, so it works under `/first-light/`; the new scene needs no font CDN, environment-map service or decoder.

```tsx
<FooterTextScene />
// Reusable with another short message:
<FooterTextScene text="Research becomes an application." />
```

## Rendering behaviour

The canvas is requested on first visible/page-visible intersection and retained afterwards. Float is eligible only while onscreen, page-visible and not reduced-motion. Canvas owns the animation loop; Float's own `autoInvalidate` stays false. Other states use demand rendering. DPR is bounded to 1–1.5. Text is stationary for reduced-motion users; loading, missing fonts, renderer failure, context loss and no WebGL retain the same readable HTML alternative and reserved height.

The camera is orthographic, so fitting uses the available width. `Center.onCentered` supplies the measured text bounds; the local fitting helper updates camera zoom only on text/viewport changes, then invalidates once. It does not subscribe to frames or tween the camera. Actual offscreen/reduced-motion quiescence is checked in the browser. Local white-front and peach-side materials expose the lettering's depth while keeping the app palette.

## Coordination and verification

Assignments were separate: one agent owned four new typography files, another owned font/license/provenance assets, and a third owned focused tests and browser evidence. The coordinator reviewed source/assets, then added the component to App.tsx before running integration checks.

Seven focused tests exercise actual wrapper activity, lifecycle cleanup, native controls and loading/failure semantics while mocking only the GPU canvas boundary. All 142 application tests pass. TypeScript and the corrected Pages-path production build pass; the existing bundle-size advisory remains. The browser verifies the actual Text3D separately from protected-layout checks that isolate unchanged GPU work. Publication requires a separate deployment request.

The final full-suite run uses one worker and passes 142/142 without changing assertions or timeouts. An earlier parallel rerun timed out in two existing typing tests and left typing work running into later tests; the fresh serial run avoids that contention. Final production assets are `index-r8Z0IJLl.js`, `index-BQct1Xpe.css` and the lazy `FooterTextCanvas-D39cuvoH.js`.

The [browser report](footer-text-browser-verification.json) confirms readable actual lettering at 1440px and 320px. The font returns 200 at the repository base path and is not requested before the footer's first intersection. One text canvas is mounted. Actual draw counts stay constant when reduced-motion, offscreen or a controlled hidden-document signal disables animation. Native WebGL context loss and unavailable WebGL retain a readable, stable-size fallback. The deliberate font-404 fixture reports the loader's expected JSON parse error while the fallback, draft and home action remain usable; the healthy scene has no page errors.

Compare the [desktop lettering](previews/footer-text-desktop.png), [mobile lettering](previews/footer-text-mobile.png) and [footer in the application](previews/footer-text-context.png). These showcases use the actual scene and star background. Protected original-app DOM comparisons isolate unrelated GPU rendering; the original footer only moves down to accommodate the new scene. Chromium with software WebGL was tested; Safari, native browser minimization and hardware performance were not verified.
