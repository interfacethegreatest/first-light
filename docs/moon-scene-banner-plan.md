# Moon scene banner

## Requirements

- Replace the miniature header presentation with one larger textured Three.js Moon scene. Remove the vector crescent during loading and failure.
- Isolate the banner, native home control, scene wrapper, and existing React template object. The home destination remains `#top`, as confirmed by the user.
- Give the full-width header a curved glass frame using the existing `--workspace-panel-border` (1px) and restrained raised styling. Keep export and research controls usable.
- Increase renderer resolution for device density and browser zoom, without changing or artificially enlarging the original Moon asset/texture.
- Keep the rest of the workspace and source-section hierarchy intact. Do not deploy this change without new approval.

## Architecture and ownership

- Header agent: new `src/components/header/MoonBanner.tsx` and CSS module only; owns the frame, home anchor and sibling export control.
- Resolution agent: `MoonMarkCanvas.tsx`, new resolution hook, and its tests only; owns bounded DPR and zoom subscriptions.
- Verification agent: browser script and screenshots/reports outside the repository only; prepares independently, tests after integration is ready.
- Coordinator: `App.tsx`, obsolete header rules in `App.css`, Moon wrapper/fallback cleanup, existing wrapper tests, documentation, integration and final review.
- Existing `SourceSections`, `SourceSection`, `sourceSectionTemplate`, and `NewUserCard` remain isolated and retain their behavior. `moonMarkTemplate` remains the reusable scene object.

## Acceptance criteria

- One real textured Moon canvas inside the `First Light home` link, no miniature duplicate or vector Moon; native click/Enter returns to `#top`.
- The banner spans the page with a shared 1px border, visibly curved corners, glass background and local depth. At 1440/390/320px, no horizontal overflow or clipped controls/glow.
- Visual opacity/glow remain scoped to the scene; the link, text, focus and export controls stay opaque and accessible.
- Renderer follows device pixel ratio and mobile visual-viewport zoom, bounded at 4; settles to demand rendering. Original 1024×512 texture, geometry, transforms, attribution and validated GLB bytes remain intact.
- Loading/error/WebGL absence leaves the text home link and application working without substituting an icon.
- Relevant unit tests, full project check, Pages-path production build and actual browser scene/control/zoom checks pass. Screenshot evidence and source code are returned with remaining source-resolution limits.

## Reviewable code

- [Banner and native controls](../src/components/header/MoonBanner.tsx) / [banner styling](../src/components/header/MoonBanner.module.css).
- [Reusable React scene object](../src/components/misc/MoonMark/moonMarkTemplate.tsx), [scene wrapper](../src/components/misc/MoonMark/MoonMark.tsx), [Canvas](../src/components/misc/MoonMark/MoonMarkCanvas.tsx), and [zoom/density hook](../src/components/misc/MoonMark/useMoonResolution.ts).
- Existing independent source feature: [section collection](../src/components/sources/SourceSections.tsx), [section component](../src/components/sources/SourceSection.tsx), [template object](../src/components/sources/sourceSectionTemplate.tsx), and [rendered card](../src/components/cards/newUserCard/NewUserCard.tsx).

`App.tsx` now mounts `<MoonBanner onExport={downloadWorkspace} />`. The shared border/glass variables stay in `App.css`; header-specific layout moves into the module.

## Reproduce checks

```sh
npm run check
VITE_BASE_PATH=/first-light/ npm run build
VITE_BASE_PATH=/first-light/ npm run preview -- --port 4197 --strictPort
```

Use `/first-light/` on that preview. Both build and preview require the same base path. The initial browser probe used a preview without that environment variable, so its entry bundle returned 404 before React mounted; restarting the preview corrected that setup error without source changes.

The full check passes 135 application tests across 14 files, 26 packer tests, original/GLB validation with zero issues, TypeScript and root production build. The separate repository-path build also passes. No lint command is configured.

## Completed browser checks

The actual production preview (`index-38DD-zh4.js`) passes Chromium checks at 1440/390/320px. Exactly one Moon canvas draws the real 205,824-index textured model, with transparent corners and GL error zero. The scene measures 112px desktop and 72px mobile; there is no SVG/vector Moon. The banner uses the shared 1px tinted border, 24px corners, glass and raised shadow, without horizontal overflow or clipping.

The native `#top` link, keyboard focus/order, JSON export, Add source, unsaved source draft, browser storage and retained Moon canvas identity all pass. The canonical GLB loads without original-asset/root-Moon requests. A deliberately unavailable WebGL context leaves an empty decorative region and a usable branded home link/form, with no replacement icon or unexpected page errors.

A device-density-3 context renders the 72px scene into a 216px framebuffer. Native CDP page/pinch scale 2 increases that to 288px (effective DPR capped at 4). Both draw the textured Moon without GL errors; draw count remains 2→2 after settling. The density/failure diagnostics suppress the unrelated StarBackground import; the normal placement/control run renders real stars. These are software-WebGL functional checks, not hardware GPU or physical-device performance measurements.

See [full browser evidence](moon-banner-browser-verification.json), [desktop banner](previews/moon-banner-desktop.png), and [mobile banner](previews/moon-banner-mobile.png). The Moon is by MaggaModels, [source](https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapted for First Light.

The existing 1024×512 source texture and all geometry/GLB/license bytes are unchanged. Higher renderer resolution improves sampling during zoom; it does not invent additional texture detail. The existing bundle-size warning remains. This change is local and has not been deployed.
