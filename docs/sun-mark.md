# Sun model and source-card mounting

The existing source-card Sun badges use the same native-wrapper, lazy Canvas,
and cached-model separation as MoonMark and EarthMark. Their existing position,
50px container, credits, card controls, and native content stay in
`NewUserCard.tsx`. Its existing `SunScene` import is a compatibility entry for
the reusable `SunMark`; the old `Sun` model import remains supported too.

```tsx
import SunMark from './components/misc/SunMark/SunMark'

<SunMark size={50} animate rotationAxis="y" rotationSpeed={-0.45} />
```

Omitting `size` fills the existing badge container. `rotationSpeed` is radians
per second; zero or `animate={false}` holds the pose. The original Calendar4
speed is retained independently of display frame rate. This is decorative
rotation, not a solar/date simulation.

## Responsibilities

- `SunMark.tsx`: native dimensions, post-content-paint loading, viewport and
  page visibility, reduced motion, desktop/touch policy, and
  error containment. Only visible, page-visible marks allocate a Canvas.
- `SunMarkCanvas.tsx`: transparent orthographic camera, bounded DPR (maximum 2),
  local lights, demand rendering while stationary, context-loss cleanup, and
  desktop drag rotation without zoom, pan, or damping. Coarse pointers retain
  ordinary page scrolling. No HDR or remote environment/decoder is requested.
- The Sun now uses the Moon's local light rig and tight camera framing, adjusted
  to its original 2.85 radius (`±2.86` camera bounds). The existing 50px card
  badge, source transforms, material, and rotation speed remain unchanged.
  `useMoonResolution` already supplies the same bounded browser-zoom handling;
  no private `.env` variables or changes to the Moon are needed.
- `SunModel.tsx`: one base-path-safe GLB URL for loading and preloading; the
  original `Sphere_Material002_0` geometry and `Material.002` material; the
  original X rotation `-Math.PI / 2` and `0.0285 × 100` scale. Readiness requires
  a primary-screen model draw. Shared loader-cache resources use `dispose={null}`
  and survive another instance retiring.

The existing source-card parent also retires its scene while offscreen/hidden.
Retiring or failing the decorative scene does not replace native card fields.
The badge stays empty while loading or if WebGL/model loading fails; no flat
Sun icon or SVG placeholder is rendered. Its dimensions stay reserved, and the
native card remains usable. Only the actual textured GLB is displayed.

## Asset and licence

Original asset: [Sun by Akshat](https://sketchfab.com/3d-models/sun-cd65c13799fd47a1aeb4c8ac018b2914),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), archived from Calendar4.
The original glTF, binary, 4096×2048 JPEG, GLB, licence, and existing visible credits
are preserved. The archived GLB packages the original data without recompression;
geometry, material, texture bytes, and source transforms are unchanged.

`public/media/sun/sun.glb` is **4,468,980 bytes**, compared with **4,470,844 bytes**
for the original JSON/binary/JPEG payload. The 1,864-byte difference is packaging
and JSON minification, not geometry or texture compression. The source contains
3,223 vertices and 5,888 triangles. Its 4K texture accounts for most of the
archived payload; the runtime display derivative is described below.

The runtime load/preload URL uses `sun-display.glb`: **949,852 bytes**, a
**78.7%** reduction from the archived GLB. Its display texture is 2048×1024,
downsampled with LANCZOS and encoded as quality-92, 4:4:4 JPEG. This is explicitly
a lossy rendering derivative, not pixel-identical packaging. Its texture width
is still twice the Moon's 1024px texture width. Geometry, UVs, material,
orientation, and scale remain identical. `sun-display.preparation.json` records
the tools, hashes, resizing/encoding settings, and preservation checks.

The RGBA8 base-level texture budget decreases from 32 to 8 MiB per renderer,
before mipmaps; this is not a measurement of total driver/GPU memory. Only
visible Sun badges own canvases, preserving their offscreen retirement policy.
The original 4K `sun.glb`, source JPEG, binary, licence, and original validation
reports remain unchanged for larger-detail uses.

In a single matched Linux Chromium/SwiftShader trial, with an 8 Mbps / 80 ms
network window started after page boot, resource duration decreased from
4897.5 to 1107.8 ms and visibility-to-model-draw from 11104.2 to 4509.3 ms.
This is lab evidence, not a Safari/device or field-latency guarantee. Normal
hierarchy and existing GPU layers were retained. A 4K re-encode alone reduced
transfer time but did not meaningfully reduce total first-draw time in that
trial, motivating the smaller display texture.

Matched crops of the 2K display versus the original 4K texture, under the same
new lighting/camera/pose, differed by at most 1/255 per RGB channel at the actual
badge footprint and tested zoom scale 2 (48px canvas buffer growing to 96px at
the DPR cap). This does not establish equality in arbitrary large viewers; the
archived 4K source remains available. The tested view retains native fields,
no SVG placeholder, and stationary demand rendering with no continuous draws.

```sh
npm ci
npm run sun:pack
npm run sun:prepare-display
npm run sun:validate
npm run typecheck
npm test
npm run build
```

No JavaScript dependency was added or upgraded. Regenerating the render asset
uses Python/Pillow, as the existing Earth preparation script does; deployed
rendering and validation do not require Python. The existing single-BIN/JPEG packer
retains its historical `pack-moon-glb.mjs` filename. `validate-sun.mjs` runs the
installed full glTF validator on source and GLB, pins source-file hashes, checks
embedded resources and exact geometry/image/accessor identity, and reports
exact output bytes. The source, original GLB, and display GLB have zero validation
errors or warnings. The display comparison checks the same geometry/metadata,
embedded JPEG hashes, and explicit 2K display/4K source dimensions separately
from original byte identity.
The regular `check` script includes Sun validation.

Browser evidence and screenshots are kept with the task artifacts. Software
Chromium checks do not establish physical Safari/Metal performance, GPU memory
usage, sustained frame rate, or field Core Web Vitals.
