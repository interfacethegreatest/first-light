# Shared glass and supplied lens

The supplied tab-bar HTML is preserved unchanged in `src/components/glass/appleGlassBoilerplate.html`. It contains an SVG displacement lens but no stylesheet. `AppleGlassLens.tsx` extracts that exact map, filter id, sRGB interpolation and scale 20 into a reusable React definitions object. The new CSS is an application adaptation of that supplied lens, not an official Apple stylesheet.

The styling objects are isolated as:

- `GlassySurface.module.css`: current shared fill, borders, radius, shadows and foreground, with inherited font family.
- `AppleGlass.module.css`: inherited lens URL and progressive backdrop enhancement, retaining the current blur fallback.
- `PaneBackground.module.css`: explicitly composes `GlassySurface`.
- `HeaderFrame.module.css`: explicitly composes `PaneBackground`, preserving header layout.

`composes` shares the declared glass classes. Custom properties carry the lens URL through the HTML tree; font family inherits explicitly. Backgrounds and borders are applied by the shared class because those properties do not inherit automatically. PaneBackground removes duplicate composed class tokens while forwarding native props, events, children and refs.

The existing app-content div receives `appleGlassTheme`. One zero-size, pointer-inert, aria-hidden SVG definitions object is appended after app-content, so existing form/control ancestry and layout stay intact. The full tab-bar reference remains isolated; its radio navigation is not mounted into First Light. The existing header home/export controls and source generation remain the active controls.

The current palette, 6px corners, 1px borders and two shadows remain. The supplied displacement map is combined with the existing 7px blur where URL backdrop filters are accepted. Without the inherited lens value, the original blur remains usable for standalone panes.

Ownership: the component agent owns only the new glass folder; the coordinator integrates the pane/header compositions and root theme; the browser agent owns only temporary evidence. The user approved publication of the completed preview through the existing GitHub Pages workflow.

Verification passes: all 135 application tests, TypeScript, the corrected production build (`index-CnX9M3oN.js`, `index-t7gPG_Mk.css`) and whitespace checks. A runtime comparison caught a missing token stylesheet in the initial CSS Modules build. `PaneBackground.tsx` now imports `styles/glass.css` directly, preserving the shared values in the production bundle and standalone consumers; the corrected bundle's token declarations and browser results were checked. The existing bundle-size advisory remains.

The [browser report](glass-inheritance-browser-verification.json) confirms unchanged protected palette, shape, typography, native hierarchy and geometry at 1440px and 320px, with only the intended backdrop filter difference. Eighteen composed targets inherit the lens and have no duplicate class tokens. There is one passive zero-size SVG with the exact supplied map and scale; no tab-bar navigation was added. Removing the root lens value restores `blur(7px)` on every protected target. Native source generation, drafts, focus, JSON export and stored data pass with no page errors.

A separately labelled synthetic stripe comparison demonstrates an actual rendered lens effect: mean absolute channel difference 7.103, with 147,669 channels differing by more than two levels. The application comparison isolates unchanged GPU scenes; neither that comparison nor the synthetic fixture is an asset or hardware-performance benchmark. Chromium was tested; Safari SVG-backdrop rendering was not tested. CSS retains the blur fallback, but the `@supports` guard establishes syntax support, not a universal rendering guarantee.
