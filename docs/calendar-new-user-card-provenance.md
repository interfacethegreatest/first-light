# Calendar4 NewUserCard and SunScene

The generated source sections use the visual card and sun scene from `interfacethegreatest/Calendar4`, pinned to commit `7b7e533e587d4991c97b63259355d1a5e9141616`.

## Source files

- [NewUserCard.tsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/newUserCard/NewUserCard.tsx)
- [newUser.module.css](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/newUserCard/newUser.module.css)
- [SunScene.tsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/react%20three%20fibre/sunScene/SunScene.tsx)
- [Sun.jsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/sun/Sun.jsx)

## Component structure

`sourceSectionTemplate.create()` still creates stable section data. Its `render()` method uses `SourceSection`, which adapts that data into `cards/newUserCard/NewUserCard.tsx`. The button, state hook, list, and template remain separate. New cards stay beneath their generating button inside Research library and remain session-only.

NewUserCard retains this import:

```tsx
import SunScene from '../../react three fibre/sunScene/SunScene'
```

SunScene lazy-loads `SunRenderer`. The renderer owns the Canvas, lighting, controls and model; `Sun.tsx` owns the imported mesh and per-instance rotation. The model, texture, sunset environment and font are hosted locally beneath Vite's configured base path.

## Source fidelity and adaptations

| Feature | Implementation |
| --- | --- |
| Card | Original translucent 135-degree gradient, 15px radius, 2px gray border, 20px backdrop blur, hover glow, decorative tile grid and loaders. |
| Size | Original 374px width becomes a 374px maximum and available-width layout. Height follows the section's content. |
| Title and content | Poppins 600, underlined and centred; flavour text is left-aligned with a 12px left inset. Existing unique heading IDs and optional controls remain accessible. |
| Panel border | The source icon-ring's five gray colours animate the full 2px panel edge over 10 seconds with `easeInOut`, infinite mirror repeats, cleanup on unmount, and a static first colour for reduced motion. CSS border transitions and hover overrides are removed so they do not compete with the motion value. |
| Badge | 50px circle, black `#030304` ground, gray 2px edge and yellow shadow, centred at the lower card edge. Absolute positioning replaces the source's transformed fixed positioning so each badge follows its own card. A 26px frame reserve prevents overlap with the next card. |
| Sun mesh | Original GLTF node `Sphere_Material002_0` and material `Material.002`; group scale `0.0285`, mesh scale `100`, rotation `[-Math.PI / 2, 0, 0]`, `dispose={null}`. |
| Animation | Original Y increment `-0.0075` per frame. Reduced motion disables automatic rotation while retaining user-controlled orbit. |
| Scene | Default Fiber camera, ambient intensity `2`, OrbitControls with zoom disabled, the actual Drei sunset environment `venice_sunset_1k.hdr`. |
| Tilt | Source 2-degree tilt for standalone cards. An existing CalendarPanel ancestor supplies tilt for nested cards, avoiding compounded transforms. Coarse pointers, reduced motion and focused controls remain steady. |

Vite uses React lazy/Suspense in place of Next dynamic imports. The original model preload points to `/sun.gltf`, which disagrees with its actual model path; that preload is omitted. Registration forms, Home navigation and the source's artificial loading timer are outside this reusable visual card. Existing section content and native controls remain usable while the real scene loads or fails.

Source CSS IDs are scoped classes, preventing duplicate IDs when several cards exist. Text stays selectable, and decorative layers do not intercept content. The existing `borderTone` field remains accepted as a data attribute; the new visual presentation uses Calendar4's neutral gray and green-hover palette.

The generated list keeps responsive 8–16px padding on its top, right and bottom; left padding is half that amount (4–8px). An empty list has zero padding. All 12 source tiles and six loader elements remain in the decorative layer.

## Dependencies and assets

The existing React 19, Fiber 9.8.2, Drei 10.7.9, Three 0.167.1, Framer Motion 11.18.2 and react-parallax-tilt 1.7.352 packages are reused. The only added package is `@fontsource/poppins@5.3.0`, importing its Latin 600 stylesheet.

The four Sun files below match the Git blob hashes from the pinned Calendar4 revision. The sunset HDR matches [Drei's pinned asset revision](https://github.com/pmndrs/drei-assets/blob/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/venice_sunset_1k.hdr).

| Local asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/media/sun/sun.gltf` | 4,100 | `eec90ac2d723f6a60e3d434afc7c069ad0a54097a7e5668b905cb4c4d9284780` |
| `public/media/sun/sun.bin` | 173,792 | `fab8f2c02324fbad514f78da6e5967ef142d020d15507c1820b0f32a85052e8d` |
| `public/media/sun/textures/Material.002_baseColor.jpeg` | 4,292,952 | `58a3314791253c999a380eab20c09320b3ff177503fe3f80abe73901ed45ee90` |
| `public/media/sun/license.txt` | 636 | `8811eb7dab80730d7afe12deea4b70aca6cc4ee5761dab85dbf7efdbe9f8ee8e` |
| `public/environments/venice_sunset_1k.hdr` | 1,397,783 | `0e72ed46b5316cb5fb67fc81ff85b024a09146fd89ef3811a8d2299647ada118` |

The first visible scene loads about 5.9MB of model/environment assets. Loader and browser caches share those resources across cards. Each nearby, visible badge has a Canvas; scrolling it away or hiding the document unmounts that Canvas. Unsupported graphics, renderer errors and context loss retain a static sun fallback without removing card content. There is no arbitrary limit on generated cards.

## Attribution

This work is based on [Sun](https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914) by [Akshat](https://sketchfab.com/shooter24994), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Each card displays credit; the original model licence accompanies the assets. The Three.js/React adaptation changes presentation, URL resolution and animation lifecycle, while the GLTF, binary and texture are unchanged.

Poppins is copyright The Poppins Project Authors under SIL Open Font License 1.1. The font licence is distributed at `public/licenses/poppins-OFL.txt` alongside the bundled font.

## Verification

- All 66 tests across seven files pass, including ten new card and scene tests. TypeScript and the production build with `VITE_BASE_PATH=/first-light/` pass.
- Production copies of the model, buffer, texture, licences and sunset HDR match the recorded sources.
- Chromium with SwiftShader renders the actual 17,664-index mesh in the 46px canvas inside the 50px badge: 1,396 lit pixels and no WebGL error in the captured sample. Rotation changes rendered pixel hashes; reduced motion stops automatic frame generation, while dragging with OrbitControls still updates the model view.
- Scrolling badges offscreen unmounts their canvases and produces actual WebGL context-loss events from renderer disposal. Scrolling back creates a working renderer again.
- The production preview loads the sun, buffer, texture, HDR and Poppins font with HTTP 200 under `/first-light/`, while the existing stars background remains active.
- Layout checks at 1440, 768, 390 and 320px show no horizontal overflow. The badge stays at the card's lower centre, content remains intact after unrelated updates, and generated sections remain in their parent below Add source.
- The animated panel border changes through the source gray palette without changing its 2px width or card dimensions, freezes at the first colour under reduced motion, and coexists with all 12 tiles and six hover loaders. Left padding is exactly half the right padding across the four checked widths; flavour text remains left-aligned with a 12px inset while headings remain centred.

Production previews: [cards](previews/calendar-new-user-cards.png) and [narrow card](previews/calendar-new-user-card-mobile.png).

These are local production-preview results. Publication has not been requested for this revision.
