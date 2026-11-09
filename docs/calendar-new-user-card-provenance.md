# Calendar4 NewUserCard and SunScene

The generated source sections use the visual card and sun scene from `interfacethegreatest/Calendar4`, pinned to commit `7b7e533e587d4991c97b63259355d1a5e9141616`.

## Source files

- [NewUserCard.tsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/newUserCard/NewUserCard.tsx)
- [newUser.module.css](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/newUserCard/newUser.module.css)
- [SunScene.tsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/react%20three%20fibre/sunScene/SunScene.tsx)
- [Sun.jsx](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/sun/Sun.jsx)
- [DateTimeWidgetModal.module.css](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/modals/DateTimeWidgetModal/DateTimeWidgetModal.module.css)

## Component structure

`sourceSectionTemplate.create()` still creates stable section data. Its `render()` method uses `SourceSection`, which adapts that data into `cards/newUserCard/NewUserCard.tsx`. The button, state hook, list, and template remain separate. New cards stay beneath their generating button inside Research library and remain session-only.

NewUserCard retains this import:

```tsx
import SunScene from '../../react three fibre/sunScene/SunScene'
```

SunScene lazy-loads `SunRenderer`. The renderer owns the Canvas, lighting, controls and model; `Sun.tsx` owns the imported mesh and per-instance rotation. `sunAssets.ts` shares the model, environment and preview URLs, warms the loader caches, and clears failed entries before retrying. The model, texture, sunset environment, preview and font are hosted locally beneath Vite's configured base path.

## Source fidelity and adaptations

| Feature | Implementation |
| --- | --- |
| Card | NewUserCard's 15px radius, hover glow, decorative tile grid and loaders, with DateTimeWidgetModal's glass surface: `rgba(35,37,49,0.5)`, 7px backdrop blur, and the source inset/outer shadows. Both workspace parents, statistics, decision cards, the next-step callout, and form fields share the same surface through CSS variables. Hover and disabled/select states retain the glass fill. Layout, focus outlines and semantic status/notice/button colours remain intact. |
| Size | Original 374px width becomes a 374px maximum and available-width layout. Height follows the section's content. |
| Title and content | Poppins 600, underlined and centred; flavour text is left-aligned with a 12px left inset. Existing unique heading IDs and optional controls remain accessible. |
| Panel border | Generated cards and other workspace panels match the Research library's `1px solid rgba(225,231,255,0.16)` edge through `--line`. The generated card's competing animated inline border is removed. Existing radii, button borders, Sun ring and decorative tile lines retain their styling. |
| Badge | 50px circle, black `#030304` ground, gray 2px edge and yellow shadow, centred at the lower card edge. Absolute positioning replaces the source's transformed fixed positioning so each badge follows its own card. A 26px frame reserve prevents overlap with the next card. |
| Sun mesh | Original GLTF node `Sphere_Material002_0` and material `Material.002`; group scale `0.0285`, mesh scale `100`, rotation `[-Math.PI / 2, 0, 0]`, `dispose={null}`. |
| Animation | Y advances by `-0.45 * delta` radians, where delta is elapsed seconds. This preserves the original `-0.0075` increment's pace at 60 FPS and keeps the same speed at other frame rates. Reduced motion disables automatic rotation while retaining user-controlled orbit. |
| Scene | Default Fiber camera, ambient intensity `2`, OrbitControls with zoom disabled, the actual Drei sunset environment `venice_sunset_1k.hdr`. |
| Tilt | Source 2-degree tilt for standalone cards. An existing CalendarPanel ancestor supplies tilt for nested cards, avoiding compounded transforms. Coarse pointers, reduced motion and focused controls remain steady. |

Vite uses React lazy/Suspense in place of Next dynamic imports. One canonical `SUN_MODEL_URL`, based on `import.meta.env.BASE_URL`, is passed to both `useGLTF()` and `useGLTF.preload()`. The supplied asset is `sun.gltf`, accompanied by its buffer and texture; there is no `sun.gltb` file. A supported card starts model and sunset-HDR preloading when it mounts, before viewport entry. Preload scheduling does not mark a scene ready: the model must actually render first. This corrects the source's mismatch between `/sun.gltf` and `/media/sun/sun.gltf`. First Light currently has no Moon renderer or Moon assets. Registration forms, Home navigation and the source's artificial loading timer are outside this reusable visual card. Existing section content and native controls remain usable while the real scene loads or fails.

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
| `public/media/sun/sun-preview.png` | 36,715 | `ee1368b3767f3640b35625372edfbdb722930f9c19df2c4b97fb747e8814d334` |

The preview is a 193px PNG captured from the actual Sun model with the existing camera, lighting and sunset environment on the badge's black background. It replaces the Unicode sun icon while loading, offscreen or unable to render; attribution is retained on every card.

The first supported card starts about 5.9MB of model/environment requests. Loader and browser caches share those resources across cards. Each nearby, visible badge has a Canvas; scrolling it away or hiding the document unmounts that Canvas. Temporary failures get up to two automatic retries with cache invalidation; inactive/hidden cards pause recovery and unmounting cancels it. Unsupported graphics or exhausted retries retain the actual Sun preview without removing card content. WebGL cannot be guaranteed on unsupported devices. Without IntersectionObserver, viewport measurements on scroll and resize preserve offscreen culling. There is no arbitrary limit on generated cards.

## Attribution

This work is based on [Sun](https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914) by [Akshat](https://sketchfab.com/shooter24994), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Each card displays credit; the original model licence accompanies the assets. The Three.js/React adaptation changes presentation, URL resolution and animation lifecycle, while the GLTF, binary and texture are unchanged.

Poppins is copyright The Poppins Project Authors under SIL Open Font License 1.1. The font licence is distributed at `public/licenses/poppins-OFL.txt` alongside the bundled font.

## Verification

- All 93 tests across nine files pass. TypeScript and the production build with `VITE_BASE_PATH=/first-light/` pass.
- Fourteen motion/URL regression tests invoke the real Sun and star frame callbacks against Three objects. They verify equal rotation at 30, 60 and 144 FPS, irregular deltas totalling one second, reduced-motion and unattached-ref guards, and matching load/preload URLs for `/` and `/first-light/`.
- Fifteen scene tests and five asset tests verify eager warmup, canonical model/HDR/preview paths, shared preload scheduling, cache clearing, bounded recovery, stale-callback protection, offscreen/tab visibility and cleanup, observer fallback, real-preview markup and usable native controls.
- Production copies of the model, buffer, texture, licences and sunset HDR match the recorded sources.
- Chromium with SwiftShader renders the actual 17,664-index mesh in the 46px canvas inside the 50px badge: 1,396 lit pixels and no WebGL error in the captured sample. Rotation changes rendered pixel hashes; reduced motion stops automatic frame generation, while dragging with OrbitControls still updates the model view.
- Scrolling badges offscreen unmounts their canvases and produces actual WebGL context-loss events from renderer disposal. Scrolling back creates a working renderer again.
- A production-browser fault test holds the first model request to verify the actual Sun preview while loading, then aborts it and verifies automatic recovery. A subsequent real `WEBGL_lose_context` event also recovers to a rendered Sun with 1,396 lit pixels and no WebGL error. Unsupported WebGL retains the preview; missing IntersectionObserver still renders and culls on scroll. Fiber intentionally reports the injected fetch error to the browser despite boundary recovery; only that exact expected error is allowed by the fault test.
- The production preview loads the sun, buffer, texture, HDR and Poppins font with HTTP 200 under `/first-light/`, while the existing stars background remains active. Both visible cards share one request to `/first-light/media/sun/sun.gltf`; the preload does not request a different path.
- Chromium verifies the modal's exact translucent background, 7px blur and two shadows on workspace panels, cards, callouts and fields, including disabled and status selects. Editing, focus outlines, native status selection and persistence remain usable. Nested glass layers soften the background more than a single modal; backdrop-filter appearance and performance depend on the browser.
- All four sides of the generated cards, workspace parents, statistics, decision cards and callout have the same `1px solid rgba(225,231,255,0.16)` border as Research library. Hover and a delayed sample retain that border; no inline border animation overrides it. The final normal-render check shows the real Sun and existing star field together without application errors.
- Layout checks at 1440, 768, 390 and 320px show no horizontal overflow. The badge stays at the card's lower centre, content remains intact after unrelated updates, and generated sections remain in their parent below Add source.
- All 12 tiles and six hover loaders remain. Left padding is exactly half the right padding across the four checked widths; flavour text remains left-aligned with a 12px inset while headings remain centred.

Production previews: [workspace and card](previews/calendar-new-user-cards.png) and [narrow card](previews/calendar-new-user-card-mobile.png).

These are local production-preview results. Publication has not been requested for this revision.
