# Moon asset provenance and validation

## Status

The asset/validation details remain current. The small-icon layout, vector fallback and original browser measurements below describe the first Moon integration, published in commit `018c05f`. The current scene-only banner and zoom-resolution changes are documented separately in [moon-scene-banner-plan.md](moon-scene-banner-plan.md).

The original assets are preserved and the self-contained GLB passes official validation and byte/value comparisons. The source is the user-confirmed Calendar4 project. Its adaptation package was unavailable, so [pack-moon-glb.mjs](../scripts/pack-moon-glb.mjs) and [pack-moon-glb.test.mjs](../tests/pack-moon-glb.test.mjs) were **locally implemented from the user's pasted brief**. These filenames do not imply that supplied package code was received or used. The generated [pack report](../public/media/moon/moon.glb.pack-report.json) records the local tool's origin explicitly.

Packaging, the original application integration and the browser comparisons below were completed before that initial deployment.

## Pinned originals

Source repository: [`interfacethegreatest/Calendar4`](https://github.com/interfacethegreatest/Calendar4), commit [`7b7e533e587d4991c97b63259355d1a5e9141616`](https://github.com/interfacethegreatest/Calendar4/commit/7b7e533e587d4991c97b63259355d1a5e9141616).

- [`moon.gltf`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/moon/moon.gltf)
- [`moon.bin`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/moon/moon.bin)
- [`Moon_baseColor.jpeg`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/moon/textures/Moon_baseColor.jpeg)
- [`license.txt`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/moon/license.txt)
- [`Moon.jsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/public/media/moon/Moon.jsx), reviewed through the GitHub connector; blob `efe50f8f85362f493bed33d6dff16436ccee51bc`.
- [`MoonScene.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/react%20three%20fibre/moonScene/MoonScene.tsx), the user-confirmed source scene path.

The four original asset/license files were downloaded directly from the pinned HTTPS raw URLs without cloning the repository. They remain byte-for-byte as downloaded. Git blob IDs and SHA-256 digests are recorded below and in [the machine-readable validation report](moon-glb-validation.json).

| File beneath `public/media/moon/` | Bytes | Git blob |
| --- | ---: | --- |
| `moon.gltf` | 4,092 | `eeda6a8f8c1b33310f7956ca48e8e3a179724d80` |
| `moon.bin` | 1,993,088 | `7f50356143a073595adeb34921df983289c98db4` |
| `textures/Moon_baseColor.jpeg` | 207,121 | `80c160b0a7c10c0bfaabcafb0b3f81ff94bb121d` |
| `license.txt` | 648 | `22d9145012a1cb9bb4f6f3ac843f789a5590cf66` |
| `moon.glb` | 2,202,504 | `61125c507ad512af629ac1c55d5c8f354983eac2` |

| File | SHA-256 |
| --- | --- |
| `moon.gltf` | `01197123bc1978340f27aa3facefef9462ef9f954be03cfa72d178bebda8c793` |
| `moon.bin` | `3f38a498e11e40b2b1f8843ba31145eb8acecdcb482dd51737ddcdf23747a17b` |
| `textures/Moon_baseColor.jpeg` | `0fa4387f232d7ff4e1dfc5256f43a31d744c6f8c52fadc1f78691d29b829f207` |
| `license.txt` | `6cb428723aa04a552841e4a3bfa6f86317707c1efc772f5401c330f747f7b7c4` |
| `moon.glb` | `193b529d7384a5f74ade8cd610d50ace8364b6bb5a6bf9975b9f18f8bd3e7ae8` |

## Local conversion and fidelity

The locally implemented [pack-moon-glb.mjs](../scripts/pack-moon-glb.mjs) uses only Node built-ins and accepts explicit input/output paths. It preserves the original binary buffer at offset zero, appends the unchanged JPEG at a four-byte boundary, adds an image buffer view and `image/jpeg` MIME type, removes buffer/image URI bindings, and writes valid GLB v2 headers/chunks. JSON padding uses spaces and BIN padding uses zero bytes. Existing JSON data, including scenes, nodes, transforms, materials, samplers, names and extras, is preserved apart from the required embedded resource bindings.

The original render payload is **2,204,301 bytes**: glTF JSON + binary + JPEG, excluding the separately retained license/notice. The GLB is **2,202,504 bytes**, 1,797 bytes smaller. This is JSON minification and packaging overhead, **not geometry or texture compression**. No geometry/index conversion, simplification, material editing, image decoding/recompression, or rescaling occurs.

Independent checks compare every original geometry-buffer byte, every embedded JPEG byte, all decoded `POSITION`, `NORMAL`, `TEXCOORD_0` and index values, and the JSON document with only resource-binding changes permitted. The GLB has no URI references requiring external resources. The validator also checks that the pack report identifies the actual source/binary/image/output hashes and preserves the source coordinate/material metadata.

The packer deliberately supports one external `.bin` and one external JPEG, without extensions. It rejects nonlocal/data/traversing resource URIs, resource symlinks escaping the source folder, unsupported versions, multiple buffers/images, embedded images, unsupported MIME/signatures, invalid declared lengths or buffer-view ranges, additional URI resources, and output symlinks/hard links that could overwrite originals. Unsupported layouts are rejected before output writes rather than silently transformed. This is a focused packer; the independent official validator checks full glTF semantics.

Verified mesh statistics:

- 36,556 vertices, 205,824 unsigned 32-bit indices, 68,608 triangles; one mesh/primitive/material.
- Mesh/node `Moon_Moon_0`; material `Moon`, double-sided, metallic factor `0`, roughness `0.8546727830033204`.
- Position minimum `[-0.9920006990432739, -0.9920012354850769, -0.9998937249183655]`; maximum `[0.9920007586479187, 0.9920002818107605, 0.9998937249183655]`.
- The preserved RGB JPEG is 1024 × 512 pixels, as reported by the official validator.

The source wrapper directly selects that geometry/material, uses mesh rotation `[-Math.PI / 2, 0, 0]`, and composes group scale `0.028` with mesh scale `100` (net `2.8`). Packing changes none of these values or the original scene graph. The runtime retains that source scale without unit normalization and uses a stationary default; the component tests and real browser checks below verify that presentation.

## Official validation

Khronos `gltf-validator` **2.0.0-dev.3.10** was run on both the original glTF with its external resources and the locally packed GLB. Both report **0 errors, 0 warnings, 0 infos, and 0 hints**, with unlimited issue output and no ignored rules. Full original and converted reports are included in [moon-glb-validation.json](moon-glb-validation.json), marked `final-local-packer`.

The [validate-moon.mjs](../scripts/validate-moon.mjs) script reads local files only. Its original-resource callback accepts only `moon.bin` and `textures/Moon_baseColor.jpeg`; the converted-resource callback rejects external resources. Default validation does not rewrite artifacts or timestamps and exits nonzero for validator errors or failed identity assertions. The report is written only when explicitly requested.

Reproduction commands, from the repository root:

```sh
node --test tests/pack-moon-glb.test.mjs
node scripts/pack-moon-glb.mjs public/media/moon/moon.gltf public/media/moon/moon.glb
node scripts/validate-moon.mjs
node scripts/validate-moon.mjs --write-report
```

The 26 Node tests use synthetic fixtures for container headers/alignment, byte and metadata preservation, deterministic output/report generation, CLI behavior and rejection cases. They do not claim to render or officially validate the real Moon. The separate Khronos and byte/value checks above cover the actual downloaded asset. In this managed environment, Node's test-worker/CLI subprocesses required the normal approved execution outside the restricted sandbox; no test was skipped for that restriction.

The generated sidecar is `<output>.pack-report.json`, with exact bytes, SHA-256/Git blob identities, original coordinate/accessor/scene/material metadata, embedding offsets/padding and explicit no-compression/no-index-conversion/no-transform-baking fields. It has no timestamp. Importing the packer exports `packMoonGlb(input, output)` without running the CLI. The earlier fixed-path preflight converter was removed; the named CLI is the canonical local implementation.

## Application integration and completed checks

The selected control is the actual `App.tsx` header home link (`header.site-header > a.brand`), retaining `href="#top"`, accessible name “First Light home”, keyboard navigation and its existing 3px accent focus outline. `moonMarkTemplate.render()` replaces only the old small Sun visual. The hero Sun paths and source-card Sun implementation remain intact.

Measured original icon boxes were 38px at a 1440px viewport and 33px at 390/320px. MoonMark now measures 42.75px and 37.125px, a 12.5% increase. Header heights remain 91px desktop and 81px mobile, with no horizontal overflow. Opacity 0.84 and `drop-shadow(0 0 5px rgba(232,240,255,0.24))` apply only to the transparent decorative visual; home-link text and focus remain fully opaque. There is no opaque plate, OrbitControls, Moon-scene environment map, bloom or star layer. The Moon scene uses local ambient/hemisphere/directional lights, an orthographic ±2.81 frustum, bounded DPR and demand rendering by default.

Completed commands:

```sh
npm run check
VITE_BASE_PATH=/first-light/ npm run build
```

The first command passes 26 synthetic Node packer tests, full original/GLB validation, TypeScript, 117 application/scene tests across 12 files and the root-path production build. The separate Pages-path production build also passes. Root and Pages load/preload URLs are tested. There is no configured lint command. The existing large-3D-bundle warning remains.

Twenty new component tests cover delta-based optional rotation at 30/60/120 FPS and irregular deltas, default stationary state, exact source transforms, shared geometry/material/disposal ownership, readiness after an actual mesh render, malformed assets, viewport/page/reduced-motion scheduling, lazy loading, observer/listener cleanup, local errors, repeated template instances, home navigation/drafts and Canvas context-loss cleanup.

The actual production preview rendered the 205,824-index Moon at the header, with 1,454 lit pixels in its desktop backing buffer and 1,096 on mobile, transparent corners and GL error 0. A single canonical GLB request returned 200, without application requests for original glTF/buffer/JPEG, erroneous root Moon paths, remote environments or decoders. The native home action, mark/Canvas identity and unsaved draft remained intact. Idle draw counts stayed 1→1 in normal mode and 3→3 after reduced-motion, offscreen and controlled-hidden checks.

A native CDP touch swipe in Chromium's 390×844 mobile/touch context began at the loaded Moon's centre and moved the page from scrollY 0 to 21px. Touch events were trusted and not prevented, targeted the native home anchor, and caused no home activation or page errors. No wheel or DOM-synthetic touch was substituted.

The original glTF and GLB were independently rendered under the same camera, source transforms and local lights at 43px and 160px, at rotations 0 and 0.7 radians. All four comparisons had **zero differing RGBA channels** and GL error 0, with the same 36,556 vertices and 205,824 indices. This compares asset fidelity under matched lighting; it does not claim unchanged Calendar4 CDN environment lighting.

Unavailable-WebGL and missing-model fixtures retained the local vector and usable native controls. The intentional 404 produced its expected R3F loading error; no unexpected page errors occurred. A further fixture retained both WebGL constructors and blocked context creation only for the Moon, leaving stars working. It restored the fallback and stopped at two context attempts and one request, unchanged after the observation period. Its expected renderer console errors were recorded; page errors were zero.

Document hiding used an explicitly labelled fixture, not native OS tab backgrounding. Shared/multiple-instance behavior is covered by the component tests. Hardware-accelerated frame pacing is not claimed. Raw completed checks and scoped failure evidence are recorded in [moon-browser-verification.json](moon-browser-verification.json).

Actual placement: [desktop header](previews/moon-header-desktop.png) and [mobile header](previews/moon-header-mobile.png). Matched asset images: [original glTF](previews/moon-original-160.png) and [packed GLB](previews/moon-packed-160.png). The Moon in these screenshots is by MaggaModels under CC BY 4.0, as credited below; screenshots reflect the First Light adaptation.

## Attribution and ownership

This work is based on [Moon](https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f) by [MaggaModels](https://sketchfab.com/MaggaModels), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The original [license.txt](../public/media/moon/license.txt) is unchanged. [NOTICE.md](../public/media/moon/NOTICE.md) identifies the repackaging and compatibility changes and the tool's local origin. Embedded attribution extras remain intact.

Rendering is owned separately from asset conversion. Its canonical paths are [MoonModel.tsx](../src/components/misc/MoonMark/MoonModel.tsx), [MoonMarkCanvas.tsx](../src/components/misc/MoonMark/MoonMarkCanvas.tsx), and [MoonMark.tsx](../src/components/misc/MoonMark/MoonMark.tsx). The preferred legacy [moonScene/MoonScene.tsx](../src/components/react%20three%20fibre/moonScene/MoonScene.tsx) path re-exports MoonMarkCanvas rather than duplicating the scene. [Moon.jsx](../public/media/moon/Moon.jsx) retains the original author/license/source header and re-exports the canonical model through `../../../src/components/misc/MoonMark/MoonModel`, without duplicating geometry or material code. These aliases are source compatibility entrypoints, not public browser-loading modules. No poster image is needed for this asset task.

The unavailable adaptation package was not used; this implementation follows the confirmed Calendar4 originals and pasted brief instead. Current banner changes require their own deployment approval.
