# Calendar4 NewUserCard and SunScene

The generated source sections use the visual card and sun scene from `interfacethegreatest/Calendar4`, pinned to commit `7b7e533e587d4991c97b63259355d1a5e9141616`.

## Source files

- [NewUserCard.tsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/newUserCard/NewUserCard.tsx)
- [newUser.module.css](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/newUserCard/newUser.module.css)
- [SunScene.tsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/react%20three%20fibre/sunScene/SunScene.tsx)
- [Sun.jsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/sun/Sun.jsx)
- [Sun scene styles.module.css](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/react%20three%20fibre/sunScene/styles.module.css)
- [DateTimeWidgetModal.module.css](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/modals/DateTimeWidgetModal/DateTimeWidgetModal.module.css)

## Component structure

`sourceSectionTemplate.create()` still creates stable section data. Its `render()` method uses `SourceSection`, which adapts that data into `cards/newUserCard/NewUserCard.tsx`. `SourceSection.tsx` explicitly passes `surfaceClassName="workspace-panel-surface"` onto the actual generated `<section>`. That shared App.css utility uses the same border and radius variables as Research library. The button, state hook, list, and template remain separate. New cards stay beneath their generating button inside Research library and remain session-only.

NewUserCard retains this import:

```tsx
import SunScene from '../../react three fibre/sunScene/SunScene'
```

SunScene directly implements Calendar4's Canvas, ambient light, orbit controls, Suspense and sunset environment. React.lazy replaces Next's dynamic Sun import. `Sun.tsx` copies Calendar4's model implementation. The custom preview, retries, cache helper, readiness flags and viewport remounting have been removed. The model, texture, sunset environment and font remain locally hosted beneath Vite's configured base path.

## Fixed tile pattern and card depth: current increment

The new tile/depth increment separates the decorative pattern from card content. Its implementation contract is a fixed 374 × 160px canvas with four 93px columns and row tracks of 28px, 52px, 52px and 14px. The canvas stays centred at the top inside a responsive, clipped decorative viewport. Narrow cards reveal less of the same centred pattern; they do not compress its tracks. Short, medium and long text therefore use the same tile geometry while the card itself keeps its natural content height.

This is an intentional conversion of Calendar4's percentage-based pattern, approximating a short reference card rather than reproducing percentage scaling on every card height. Tile 15 and the six loader animations also use fixed pixel dimensions/endpoints, so their geometry does not grow with the text. The decorative component owns all twelve tiles and six loaders. NewUserCard imports it rather than retaining a second JSX/CSS copy.

The card-depth adjustment is local to NewUserCard: a subtle inner rim and contact shadow add depth alongside the existing shared glass shadow. This increment preserves App.css, the shared border/radius/glass tokens, the copied Sun scene, content editing, controls, tilt and reduced-motion support. Current verification is recorded below; requirements and ownership are in [the fixed-tiles plan](source-card-tiles-plan.md).

| Canonical file | Ownership |
| --- | --- |
| [SourceSection.tsx](../src/components/sources/SourceSection.tsx) | The isolated generated section adapter: title/heading identity, optional controls/content and the explicit shared surface class. |
| [sourceSectionTemplate.tsx](../src/components/sources/sourceSectionTemplate.tsx) | The existing canonical boilerplate object: stable instance creation and keyed section rendering. |
| [NewUserCard.tsx](../src/components/cards/newUserCard/NewUserCard.tsx) | Card composition, importing CardTiles while retaining its heading, body, controls and Sun. |
| [CardTiles.tsx](../src/components/cards/newUserCard/CardTiles.tsx) | The isolated CardTiles component and its twelve tile/six loader elements. |
| [cardTiles.module.css](../src/components/cards/newUserCard/cardTiles.module.css) | Fixed pattern geometry, responsive clipping and decorative hover/loader motion. |
| [newUser.module.css](../src/components/cards/newUserCard/newUser.module.css) | Card layout and local rim/depth styling; the extracted tile/loader CSS belongs in the tile module. |

These are the implementation sources. No duplicate section, template object or copied JSX is needed in this document.

## Source list expansion and reveal

`SourceSections` wraps the existing grid in `AnimatedHeight`. An inner `flow-root` measures the grid's full intrinsic height, including its top margin, responsive padding and reserved space beneath the Sun badges. ResizeObserver detects changes; `offsetHeight` avoids measuring the parent tilt's transformed bounds.

The outer wrapper animates actual CSS height for 300ms with `easeOut`. Research library and its following content therefore grow through normal document layout, without scaling the card text or Sun. Rapid updates retarget from the current displayed height. Once settled, the wrapper returns to `height:auto` and visible overflow. Temporary clipping during expansion prevents new content from overlapping the following library section.

Initial content, reduced motion, focused descendants and browsers without ResizeObserver use immediate natural height. Focus or preference changes cancel motion without replaying earlier growth. Observers and animation controls are cleaned up on unmount; the existing keyed section/card/Canvas nodes remain mounted. The Add source button sits outside the focused-content guard.

`AnimatedHeight.onSettled` reports after releasing its numeric bounds. `SourceSections` uses this completion signal to reveal its pending batch. New panel wrappers remain in measurable layout with hidden visibility, `inert` and `aria-hidden` during expansion. Once the parent fits, each keyed Framer Motion div fades and moves up 8px over 180ms, with 120ms between newly added panels. This delay starts at zero for each new batch, rather than growing with the total number of panels.

NewUserCard inherits the `hidden`, `visible` and `settled` variants. Its heading and body move up 6px and fade over 200ms, using an 80ms child stagger. The Sun badge only fades, preserving CSS's horizontal centring transform. Its explicit 200ms delay starts it after the body's 160ms slot without reordering the section DOM. Initial content and immediate settlement use zero-duration variants; existing panels keep their nodes and never restart their entrance. Focus or reduced motion settles pending travel and delays. Standalone cards stay visible without a motion ancestor. The existing SourceSection, template object, App.css and card module remain the rendering/styling sources; none is combined into a new duplicate implementation.

The requirements, acceptance criteria and ownership are recorded in [the sequence plan](source-section-motion-plan.md).

The real-Sun browser run verified fixed panel top, correct final parent growth and matching displacement of “Your sources”, natural height restoration, rapid additions, retained Canvas/draft/storage identity, native textarea resizing, live and initial reduced motion, settled glass and all four viewport widths. It did **not** pass the painted-intermediate-height criterion: Chromium's software renderer delivered successive samples seconds apart, skipping the 300ms transition. A separate final-build diagnostic hid the Sun Canvas before mount; callbacks still arrived 300–600ms apart, so the timing limit extends beyond Sun startup. The final-build diagnostic confirmed parent growth from 645.78 to 987.28px and then to 2720.28px with zero movement of its top, exact following-library displacement, and restored natural sizing. Smoothness still needs a hardware-accelerated browser check; the copied Sun renderer is unchanged.

## Source fidelity and adaptations

| Feature | Implementation |
| --- | --- |
| Card | NewUserCard's hover glow, with the tile grid/loaders extracted under the fixed-size contract above. DateTimeWidgetModal supplies the shared `rgba(35,37,49,0.5)` tint and inset/outer shadow values; the new card rim/depth is local to the module. Container blur uses a separate negative-z, pointer-inert `::after` layer, so an ancestor's filter does not suppress nested glass. Form fields retain their direct 7px blur. Both workspace parents, statistics, decision cards, callout and fields share the glass values. |
| Size | Original 374px width becomes a 374px maximum and available-width layout. Height follows the section's content. |
| Title and content | Poppins 600, underlined and centred; flavour text is left-aligned with a 12px left inset. Existing unique heading IDs and optional controls remain accessible. |
| Panel border | App.css owns `--workspace-panel-border` and `--workspace-panel-radius`; both `.panel` and `.workspace-panel-surface` consume them directly. Defaults are `1px solid rgba(225,231,255,0.16)` and `7px`. The module's zero-specificity fallbacks preserve standalone cards without overriding the shared utility. Other radii, button borders, Sun ring and decorative tile lines retain their styling. |
| Badge | 50px circle, black `#030304` ground, gray 2px edge and yellow shadow, centred at the lower card edge. Absolute positioning replaces the source's transformed fixed positioning so each badge follows its own card. A 26px frame reserve prevents overlap with the next card. |
| Sun mesh | Original GLTF node `Sphere_Material002_0` and material `Material.002`; group scale `0.0285`, mesh scale `100`, rotation `[-Math.PI / 2, 0, 0]`, `dispose={null}`. |
| Animation | Calendar4's original `rotation.y += -0.0075` per frame is restored as requested. It is frame-rate dependent. The host Canvas uses demand frames for reduced motion; normal rendering follows the copied source. The separate stars background retains its existing delta-based rotation. |
| Scene | Default Fiber camera, ambient intensity `2`, OrbitControls with zoom disabled, the actual Drei sunset environment `venice_sunset_1k.hdr`. |
| Tilt | Source 2-degree tilt for standalone cards. An existing CalendarPanel ancestor supplies tilt for nested cards, avoiding compounded transforms. Coarse pointers, reduced motion and focused controls remain steady. |

The Sun source adaptations are limited to TypeScript types, React.lazy in place of Next dynamic, a CSS module class in place of a repeated Canvas ID, and base-aware local asset paths. Both `useGLTF()` and its preload use the actual `media/sun/sun.gltf` path. The local sunset HDR is the exact file selected by the source's Drei sunset preset. Canvas demand mode preserves First Light's reduced-motion setting without adding model loading logic. Registration forms, Home navigation and the source's artificial loading timer remain outside the reusable card.

Source CSS IDs are scoped classes, preventing duplicate IDs when several cards exist. Text stays selectable, and decorative layers do not intercept content. The existing `borderTone` field remains accepted as a data attribute; the new visual presentation uses Calendar4's neutral gray and green-hover palette.

The generated list keeps responsive 8–16px padding on its top, right and bottom; left padding is half that amount (4–8px). An empty list has zero padding. The fixed-pattern increment preserves all twelve source tiles and six loader elements in their own decorative layer, independent of section content height.

## Dependencies and assets

The existing React 19, Fiber 9.8.2, Drei 10.7.9, Three 0.167.1, Framer Motion 11.18.2, react-parallax-tilt 1.7.352 and Poppins 5.3.0 packages are reused. The fixed-pattern/depth increment adds no dependencies.

The four Sun files below match the Git blob hashes from the pinned Calendar4 revision. The sunset HDR matches [Drei's pinned asset revision](https://github.com/pmndrs/drei-assets/blob/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/venice_sunset_1k.hdr).

| Local asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/media/sun/sun.gltf` | 4,100 | `eec90ac2d723f6a60e3d434afc7c069ad0a54097a7e5668b905cb4c4d9284780` |
| `public/media/sun/sun.bin` | 173,792 | `fab8f2c02324fbad514f78da6e5967ef142d020d15507c1820b0f32a85052e8d` |
| `public/media/sun/textures/Material.002_baseColor.jpeg` | 4,292,952 | `58a3314791253c999a380eab20c09320b3ff177503fe3f80abe73901ed45ee90` |
| `public/media/sun/license.txt` | 636 | `8811eb7dab80730d7afe12deea4b70aca6cc4ee5761dab85dbf7efdbe9f8ee8e` |
| `public/environments/venice_sunset_1k.hdr` | 1,397,783 | `0e72ed46b5316cb5fb67fc81ff85b024a09146fd89ef3811a8d2299647ada118` |
The first model and sunset environment requests total about 5.9MB. Loader and browser caches share those assets across cards. Each mounted card owns a Canvas, as in Calendar4; there is no preview image or custom retry/visibility machinery. The source requires working WebGL, and many simultaneous canvases can reach browser graphics limits. Normal animation has the source's per-frame speed behavior.

## Attribution

This work is based on [Sun](https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914) by [Akshat](https://sketchfab.com/shooter24994), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Each card displays credit; the original model licence accompanies the assets. The Three.js/React adaptation changes presentation, URL resolution and animation lifecycle, while the GLTF, binary and texture are unchanged.

Poppins is copyright The Poppins Project Authors under SIL Open Font License 1.1. The font licence is distributed at `public/licenses/poppins-OFL.txt` alongside the bundled font.

## Current fixed-tile verification

- `VITE_BASE_PATH=/first-light/ npm run check` passes all 97 existing tests across ten files, TypeScript and the production build. This styling change adds no unit tests that simply repeat CSS declarations.
- Browser cards measured 260, 435 and 888px tall for the three ipsum lengths. Appended output increased the first to 1282px; every decorative canvas remained 374×160px, with four 93px columns, rows 28/52/52/14px and unchanged tile dimensions/relative positions.
- All six real CSS hover animation endpoints stayed fixed across card heights, appended output, and 1440/390/320px viewports. Decorative viewport widths were 372/293/230px; the canvas remained centred and clipped with no horizontal page overflow.
- Reduced motion suppresses decorative animations and transitions. The decorative layer retains `pointer-events:none`. Shared 1px borders, 7px corners, the half-opacity tint and 7px blur remain effective; the local rim/contact shadows preserve the shared glass shadow without introducing a filter, opacity group or transform.
- A separate real Sun/star rendering check retained 1,396 lit Sun pixels with GL error 0, centred 50px badges, section/Canvas identity, unsaved field drafts and unchanged storage. No page errors occurred. Geometry/hover checks isolated GPU work; no new real-time smoothness claim is made.

## Prior verified checkpoint

The following checkpoint and browser observations describe the earlier implementation, including the published two-stage reveal. Current fixed-pattern and depth checks are listed above.

- All 97 tests across ten files pass. TypeScript and the production build with `VITE_BASE_PATH=/first-light/` pass.
- Thirteen measured-height tests verify initial natural sizing, growth/shrink, retargeting, stale completion guards, automatic bounds release, focus/reduced-motion handling, observer cleanup/fallback and retained section/Sun identity. Settlement callbacks run after natural bounds return, and changing callback identity does not restart playback. Removing a focused child without a blur event does not suppress later growth or focus cancellation.
- Seven sequence tests verify hidden/inert pending panels, release after final height completion, real inherited child completion, rapid retargeting without early release, initially populated lists, reduced-motion and missing-observer appends, live cancellation, retained nodes and focused output.
- A controlled browser clock observed 37 numeric-height samples with pending cards hidden. First-card heading/body/Sun opacity began at 521/681/713ms; the next card followed 128ms later. This proves logical ordering using Framer's JavaScript fallback with GPU work and native WAAPI isolated. It does not establish real-time smoothness.
- A real-clock browser check restored normal motion and added another card without replaying the existing one or replacing its Canvas. The real Sun rendered 1,396 lit pixels with no GL error. Desktop and 390px checks retained centred 50px badges, 1px borders, 7px corners, drafts and storage. Settled wrappers have opacity 1, no transform and `will-change:auto`; glass transmission remains 24.05% for card/input/textarea. No application errors were reported. Hardware-accelerated smoothness remains unverified.
- Model tests verify Calendar4's original Sun frame increment, geometry/material, transforms, group prop forwarding and disposal, plus identical root/Pages load and preload URLs. Scene tests verify the copied lighting, controls, sunset environment and the host reduced-motion mode. Separate stars tests retain delta-based motion coverage.
- The controlled browser test keeps the exact supplied tint and shadows. Nested cards, inputs and textareas transmit 24.12% of a red/blue backdrop (24.05% black/white), versus 11.76% with the old ancestor-filter configuration. The standalone modal reference transmits 48.94%; nested half-opacity surfaces still naturally compound.
- Fresh checker patterns painted on each target's immediate wrapper prove real blur rather than a preblurred ancestor. Input/textarea contrast falls from RGB standard deviation 62.49 without blur to 21.61 with 7px blur; card contrast falls from 62.50 to 21.36.
- Changing only `--workspace-panel-border` to a 3px border and `--workspace-panel-radius` to 19px updates both Research library and the actual generated section. Restoring defaults returns both to 1px and 7px. Removing the shared class/custom values in the test browser confirms the module's standalone fallback still works.
- Chromium with SwiftShader renders three actual 17,664-index Sun meshes at once. Each 46px canvas has 1,396 lit pixels and no WebGL error. Rotation changes rendered pixel hashes; demand mode stops automatic Sun frames, while OrbitControls dragging still updates the view. The same Canvas instances survive scrolling and unrelated draft updates.
- The normal production preview loads one shared GLTF request, buffer, texture and sunset HDR with HTTP 200 under `/first-light/`. Asset hashes match the original sources. The existing star field renders alongside the Sun scenes. There are no application errors in the normal tested path.
- At 1440, 768, 390 and 320px, native editing, focus outlines, status selection and persistence remain usable, with no horizontal overflow. The 50px Sun badge remains unclipped and centred on its own card's lower edge. Natural card height, stable identity, source drafts and session-only section creation are preserved.

Production previews: [workspace and cards](previews/calendar-new-user-cards.png) and [narrow card](previews/calendar-new-user-card-mobile.png).

Controlled browser evidence: [corrected glass](previews/glass-proof-current.png) and [previous filter configuration](previews/glass-proof-previous.png). These use temporary checker stripes for measurement; the application retains its original star background.

## Publication history

The glass and Calendar4 Sun restoration was published from main commit `43f84e563587ebf68031f93efed34cbb3a63691c` in Pages run 42673033223, attempt 3, after GitHub's Actions service recovered. The parent-height animation followed from main commit `a16ebe2400e5bee3245d2090064f83b0ceaef6c2` in successful Pages run 42680992212. Public checks confirmed those releases.

The two-stage staggered reveal was subsequently published through [PR #11](https://github.com/interfacethegreatest/first-light/pull/11), from main commit `503462d19f42b376f8d27c5ac74abf24c4f4cfd7`, in [Pages run 42686712041](https://github.com/interfacethegreatest/first-light/actions/runs/42686712041).

The new fixed-tile/card-depth increment is not deployed. Its verification and publication are separate from the completed releases above.
