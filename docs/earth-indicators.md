# Earth indicators

## Requirements and architecture

Replace the two fixed green indicators beside the header's **Local** label and the workspace's **Stored in this browser** note with small, textured Calendar4 Earth scenes. Keep the Moon home link, export action, labels, research forms, generated source sections and other scenes intact. Deployment is authorized for this increment.

`EarthMark` follows the existing Moon's wrapper / Canvas / model boundaries. Its 12px header and 14px workspace instances are decorative and pointer-inert. The shared activity hook pauses motion offscreen, in hidden documents and for reduced motion; the existing elapsed-time rotation hook supplies Y-axis spin at −0.12 radians per second and skips the first resume delta. Paused scenes use demand rendering. The renderer starts lazily and reports ready only after an actual main-framebuffer model draw; loading/error SVGs are separate, explicitly marked fallbacks.

The model uses Calendar4's `Object_4` geometry, `Scene_-_Root` material and direct mesh scale of 2.8. It does not apply the Moon's X rotation or a second ancestor scale. Two renderers share the cached asset URL and retain cached resources across unmounts. Local lights, a transparent orthographic camera, bounded DPR and no controls preserve native page behavior. Existing library versions remain unchanged.

## Assets

The source is `earth.gltf`, `earth.bin` and its JPEG texture, rather than a `.gltb` file. Preserve those files, source wrapper and licence. Retain a self-contained, uncompressed full-resolution `earth.glb`, with a separately validated `earth-icon.glb` for the indicators. Load and preload use the same Pages-aware icon URL.

The original 8192×4096 JPEG is 22,492,705 bytes and has a nominal decoded RGBA8 size of 128 MiB before mipmaps. A 1024×512 derivative is appropriate for these tiny scenes: it retains the original UV layout, geometry and material and has a nominal decoded RGBA8 size of 2 MiB before mipmaps. These are texture-size calculations, not measured GPU residency or device performance. The derivative is a documented resampling operation, not a byte-identical original image. Full-resolution source assets remain available unchanged.

The full-resolution GLB is **24,335,432 bytes**; the runtime icon GLB is **2,043,928 bytes**, including its **201,206-byte** JPEG. Both retain 33,708 vertices and 63,488 triangles. Original glTF, full GLB and icon GLB each pass full Khronos validation with zero errors or warnings. Packaging the original does not compress it; the icon's smaller size comes from its separately documented image resampling.

See [asset provenance and reproduction](earth-asset-provenance.md) and [validator evidence](earth-glb-validation.json). Credit PatelDev, the original Sketchfab source and CC BY 4.0 in the existing footer credits, including packaging/implementation adaptations.

## Ownership and sequencing

- Asset agent: Earth originals, packages, preparation/validation scripts and asset provenance.
- Interface agent: the new `components/misc/EarthMark/` folder only.
- Verification agent: focused Earth tests and temporary browser artifacts only.
- Coordinator: App/header integration, obsolete dot CSS removal, check command, source snapshots, review, final production checks and release.

Asset and interface work are independent. Integration follows the component handoff; browser checks follow the validated icon asset and production build. Release follows review and checks.

## Acceptance and verification

Require full glTF validation of both source and packages; matching geometry, material, transforms and texture provenance; embedded resources; exact byte counts; and no root `/earth.gltf`, full-resolution runtime download, external environment map or decoder request. Check frame-rate-independent rotation, pause/resume, cleanup, first-draw readiness, shared resources and renderer failures. Verify actual textured Earths in both real call sites at desktop/390px/320px, preserved home/export/forms/drafts, and no new overflow. Keep source-section styling and other scenes unchanged.

`VITE_BASE_PATH=/first-light/ npm run check` passed: 26 packer tests, Moon validation, all three Earth validations, strict TypeScript, 242 application tests across 29 files, and both production entry builds. The normal sandbox's child Node test runner exited before the fixture suite; the complete check passed outside that sandbox. There is no lint script; the existing large-bundle advisory remains. The regenerated sourcebook/ZIP passes snapshot verification. No dependency versions changed.

The full run initially found two old header-wide SVG assertions and an asynchronous URL-revocation mock leak in the new export test. The assertions now target the Moon region, preserving its no-vector requirement while permitting the separate Earth fallback. The export test awaits its real cleanup timer before restoring globals. The production export and Moon code were not changed.

Actual normal-page Chromium/SwiftShader checks rendered both textured models with 190,464-index host draws and 1024×512 texture uploads. Both marks reached `loaded`, removed the fallback and retained their native 12/14px boxes. Y rotation changed the model matrices; reduced motion, actual offscreen placement and a controlled hidden-document fixture stopped continuous draws after queued frames drained. A single shared icon request returned the exact 2,043,928-byte validated package; no full-resolution Earth, root Earth glTF or decoder request occurred. The Earth scenes use local lights without an environment preset. Native home/focus/export, three-source creation, drafts, saved records and layouts at 1440/390/320px passed with no new overflow or healthy-page/console errors.

Deliberate Earth-asset 404 and unavailable-WebGL fixtures showed the local fallbacks while native page actions remained usable. The 404 fixture reports two matching injected asset-load errors; these are retained in the report rather than represented as an error-free load. The preload cache catches loader rejections and later surfaces the cached error during render. Context-loss handling and stale callbacks are also covered by focused tests. A failed icon remains a fallback until remount/reload; automatic retry is not promised.

See the actual [desktop](previews/earth-indicators-desktop.png) and [mobile](previews/earth-indicators-mobile.png) placement screenshots. They use a synthetic record in the isolated browser profile to test preservation/export; no starter records were added to the application. Raw browser evidence and fault/queued-frame diagnostics are under `/workspace/artifacts/first-light-earth/`.

Two Canvas contexts share the loader cache but keep their own GPU resources. Linux Chromium software rendering cannot certify Safari, Apple GPU performance, thermals or sustained physical-device pacing. Narrow-width checks used a desktop pointer, and the hidden-document check controlled the document state/event rather than native OS tab hiding. Those limits remain explicit; no physical-device performance claim is made.
