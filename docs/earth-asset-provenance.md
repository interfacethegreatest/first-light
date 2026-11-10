# Earth asset provenance

The Earth asset is the real Calendar4 model, with its original archive preserved. The separately named `earth-icon.glb` keeps the same geometry and material with a smaller texture for the two small UI marks. Full source quality remains available in `earth.glb`.

## Source and attribution

Pinned repository: [interfacethegreatest/Calendar4, commit 7b7e533e587d4991c97b63259355d1a5e9141616](https://github.com/interfacethegreatest/Calendar4/commit/7b7e533e587d4991c97b63259355d1a5e9141616). GitHub's connected directory/tree metadata supplied the source blob IDs. Local downloads used the pinned `raw.githubusercontent.com` URLs with normal proxy and TLS verification; each downloaded file's Git blob ID matches that metadata.

> This work is based on “[Earth](https://sketchfab.com/3d-models/earth-f7a76c63ff1846afb2d606e5c8369c15)” by [PatelDev](https://sketchfab.com/PatelDev), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The original [license notice](../public/media/earth/license.txt) and [Earth.jsx wrapper](../public/media/earth/Earth.jsx) remain byte-identical, including their original attribution. [NOTICE.txt](../public/media/earth/NOTICE.txt) records local packaging and texture changes. Retain the attribution when sharing the model or derivatives. Calendar4's repository ownership does not replace the model author's license.

## Archived and generated files

| File under `public/media/earth/` | Exact bytes | SHA-256 |
| --- | ---: | --- |
| `earth.gltf` | 4,024 | `edeba119bf0d440d2f6e5618b84d1f320dd748efabec7bcd7b9f6c8775ad0806` |
| `earth.bin` | 1,840,512 | `1adaff7a2857ed14bb0749c9debb60262f544a5724a3e6b2e5f5d3e2fa8ed8f4` |
| `textures/Scene_-_Root_baseColor.jpeg` | 22,492,705 | `f756869160529f667bbaf1316ce436a355d29d0b4b8a418eb141f79fe56b4f4f` |
| `license.txt` | 640 | `0d1600fdefbe26be589b130f3ac8f34c21e5b53d204c3f9addd715bd708f0c00` |
| `Earth.jsx` | 960 | `3ab5cf64c4a7c65eba63290e4c28f41edfa275c2b97da8135dad7bb2c7db6fcc` |
| `earth.glb` | 24,335,432 | `3ac3a6c3bf6d0712fa89ca5c3c0236b7862ec74cc1da7cde97b12f6da9d36a12` |
| `icon/Scene_-_Root_baseColor.jpeg` | 201,206 | `d2db5898b7b7be559fcc4daafffcee0ad0fc6a233e2acb7695821a3e34127dcf` |
| `earth-icon.glb` | 2,043,928 | `b4e0d0bea753e317578e3e6e90d06ca3d7426cb45deece70a37c33cc2a02b663` |

The pinned source Git blobs are:

- `earth.gltf`: `b6b4f0e0e5800e2e59ffaefca0e9fb31e616f1ce`.
- `earth.bin`: `ec3f96c2e3945e55dabfaecf7200423d68d268d4`.
- Original JPEG: `05dede73ba99f70be4ea4b87b22e167b5fbd840a`.
- `license.txt`: `49bf5fedbee90d87f4012440b4366666f8b80e51`.
- `Earth.jsx`: `e2059bf0194ace086e0df3d3f83449b6768efda9`.

[The validation report](earth-glb-validation.json) contains complete file hashes, both pack-report hashes, decoded geometry comparisons and all official validator messages. The [full pack report](../public/media/earth/earth.glb.pack-report.json), [icon pack report](../public/media/earth/earth-icon.glb.pack-report.json), and [icon preparation report](../public/media/earth/icon/preparation-report.json) separate original bytes from derivative bytes.

## Conversion and icon derivative

[The existing `pack-moon-glb.mjs`](../scripts/pack-moon-glb.mjs) is reused unchanged. Its historical name and function name remain; it supports this model's single external BIN and JPEG layout. It was locally implemented earlier from the pasted adaptation brief, rather than obtained from a supplied converter package.

The full GLB embeds all original BIN and JPEG bytes, removes their resource URIs, adds an image buffer view and MIME type, and writes aligned GLB 2.0 chunks. All other JSON data is preserved. The source JSON + BIN + JPEG total is **24,337,241 bytes**; the GLB is **1,809 bytes smaller** through JSON minification and container layout. This is not geometry or texture compression.

[`prepare-earth-icon.py`](../scripts/prepare-earth-icon.py) uses the installed Pillow **13.0.0** JPEG codec **6.2** for a development-only derivative. It downsamples the actual RGB texture from **8192×4096** to **1024×512**, using LANCZOS, JPEG quality **90**, explicit **4:2:0** chroma subsampling, and no optimization/progressive encoding. The original image has no ICC or EXIF metadata. No automatic color transform, enhancement, image synthesis or UV change is applied. JPEG re-encoding is lossy, so icon image identity with the original is explicitly false.

The script creates a temporary source package with the byte-identical original JSON and BIN and the prepared JPEG at the original relative texture URI. It runs the existing packer, then removes the temporary package. No public BIN copy, symlink or broken derivative glTF is needed. The icon pack report's image hash identifies this staged derivative JPEG; the full pack report's image hash identifies the original JPEG.

Both GLBs retain the same 33,708 vertices, 190,464 indices, 63,488 triangles, names, accessors, normals, UVs, materials and scene transforms. There is no simplification, index conversion, transform baking, Draco/Meshopt compression or geometry normalization.

The original texture's RGBA8 base level alone represents **134,217,728 bytes (128 MiB)** of decoded pixels, before mipmaps and renderer overhead. The icon texture represents **2,097,152 bytes (2 MiB)**, a 64-fold pixel reduction. These are calculated pixel storage sizes, not measured GPU residency. Runtime should use the **2,043,928-byte `earth-icon.glb`** for the small marks rather than downloading the 24,335,432-byte full-quality archive. Geometry cost remains unchanged.

## Wrapper and runtime contract

The archived source wrapper accesses `nodes.Object_4.geometry`, `materials['Scene_-_Root']` and mesh `scale={2.8}` directly. It has **no mesh X rotation**. Its material is double-sided, metallic factor `0`, roughness `0.4`, with the original base-color texture binding. Source position bounds remain approximately ±0.98723 in X/Z and ±0.99758 in Y.

The GLB retains the complete original scene graph, including ancestor matrices. A runtime following the source wrapper uses the direct mesh geometry; mounting those ancestors as well would add transforms that the wrapper does not apply. Do not copy Moon's orientation into Earth. The archived wrapper's original per-frame spin and mismatched `/earth.gltf` preload are preserved as historical source, not used as a deployment URL example.

The separate runtime implementation is [EarthModel](../src/components/misc/EarthMark/EarthModel.tsx), [EarthMarkCanvas](../src/components/misc/EarthMark/EarthMarkCanvas.tsx) and [EarthMark](../src/components/misc/EarthMark/EarthMark.tsx). The runtime must resolve its shared load/preload URL using `import.meta.env.BASE_URL` and `media/earth/earth-icon.glb`. This asset document does not establish UI placement, browser motion, fallback, visibility or device performance outcomes.

## Reproduce and validate

With the project's existing Node dependencies and development Pillow available:

```sh
node scripts/pack-moon-glb.mjs public/media/earth/earth.gltf public/media/earth/earth.glb
python3 scripts/prepare-earth-icon.py
node scripts/validate-earth.mjs
```

Default validation is read-only. To explicitly regenerate the committed validation report:

```sh
node scripts/validate-earth.mjs --write-report
```

The narrow validator verifies pinned original blob IDs, pack/preparation hashes, GLB headers and alignment, source-to-GLB JSON identity except resource embedding, every original geometry byte, every decoded POSITION/NORMAL/TEXCOORD_0/index value, original JPEG identity for the full GLB, and prepared JPEG identity for the icon GLB. It checks both texture dimensions and rejects external URI references. Original glTF resource requests use a fixed local whitelist; no network requests are made. Validation exits nonzero on errors or failed identity assertions.

Observed asset validation with **Khronos glTF Validator 2.0.0-dev.3.10**: original glTF, full GLB and icon GLB each report **0 errors, 0 warnings, 0 infos and 0 hints**. Rendering parity, application regressions, Safari testing and deployment remain coordinator-owned checks; no such outcomes are claimed here.
