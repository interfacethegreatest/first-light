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
The original glTF, binary, 4096×2048 JPEG, licence, and existing visible credits
are preserved. First Light adapts the runtime and packages the same data as GLB;
geometry, material, texture bytes, and source transforms are unchanged.

`public/media/sun/sun.glb` is **4,468,980 bytes**, compared with **4,470,844 bytes**
for the original JSON/binary/JPEG payload. The 1,864-byte difference is packaging
and JSON minification, not geometry or texture compression. The source contains
3,223 vertices and 5,888 triangles. Its 4K texture remains the main payload and
can consume separate GPU texture memory in each renderer context.

```sh
npm ci
npm run sun:pack
npm run sun:validate
npm run typecheck
npm test
npm run build
```

No dependency was added or upgraded. The existing generic single-BIN/JPEG packer
retains its historical `pack-moon-glb.mjs` filename. `validate-sun.mjs` runs the
installed full glTF validator on source and GLB, pins source-file hashes, checks
embedded resources and exact geometry/image/accessor identity, and reports
exact output bytes. Both assets have zero validation errors or warnings.
The regular `check` script includes Sun validation.

Browser evidence and screenshots are kept with the task artifacts. Software
Chromium checks do not establish physical Safari/Metal performance, GPU memory
usage, sustained frame rate, or field Core Web Vitals.
