# Rendering performance contract

Applies to the main page and every added Three.js scene. Run the production
build and `npm run perf:budget` before accepting changes. Budget changes need
measured evidence and review; splitting a large file into eagerly loaded files
does not reduce the critical path.

## Requirements and architecture

- Native content, labels, controls, keyboard focus and drafts render without
  WebGL. Decorative failures stay inside their scene boundary. Keep allocated
  DOM space stable through loading/failure and test mobile horizontal overflow.
- Native wrappers, settings and types must not import GPU code at runtime.
  Lazy-load the renderer/model at the visible call site. Do not preload hidden
  models, fonts, HDRs or scene modules from the main entry. Defer full-screen
  decoration until the initial content has painted. `useContentPaintReady`
  shares one buffered Paint Timing observer across wrappers; GPU requests wait
  for actual FCP. Browsers without Paint Timing use two rAF opportunities and
  a task, with cancellation. Native content never waits for the gate.
- Current build budgets use **gzip level 9**, not raw size or an assumed CDN
  transfer: initial main-page JS <=120 KiB, initial CSS <=12 KiB, individual JS
  chunks <=350 KiB. Include the entire recursive static import graph and HTML
  modulepreloads exactly once; exclude unrequested dynamic imports. Manifest
  outputs must exist. The browser report separately measures actual level-6
  encoded transfer on the test server, including requested dynamic code.
- Vite/esbuild already minify and Rollup tree-shakes. Avoid manual chunk groups
  that promote deferred GPU code into entry imports. Do not raise the generic
  chunk warning limit to conceal weight. Package installation size and copied
  public archives are not evidence of bytes transferred on navigation.
- Production syntax targets ES2020/Safari15.4. This does not polyfill missing
  browser APIs or certify a particular iPhone; retain native WebGL fallbacks.
- Keep native stylesheet loading stable unless a measured component boundary
  can defer it without a layout shift. No speculative font/network preloads,
  prefetch, preconnect or service worker. Add these only after measuring their
  actual first/repeat-visit benefit and caching invalidation behavior.
- For HTML images use explicit sizes, responsive sources, modern encodings
  with appropriate fallbacks and lazy loading below the fold. glTF textures
  require loader-compatible derivatives and visual validation, not HTML image
  attributes or blindly changing filenames. Preserve source assets/licences.

## Renderer and GPU budgets

- Use Fiber-owned renderers. Installed Fiber 9.8.2 defaults to WebGLRenderer
  `powerPreference: 'high-performance'`, disposes renderer caches and forces
  context loss on unmount. Do not force-dispose loader-cache resources shared
  by another mounted scene. A custom renderer factory must implement equivalent
  ownership, teardown and initialization/error handling.
- Set an explicit DPR bound: full-screen decoration <=1.5, small textured marks
  <=2, glass Automatic/Balanced <=1.25 and High <=1.75. Retain page zoom and
  responsive sizing, but do not multiply pinch zoom into unbounded buffers.
  Alpha is needed for objects composited over the page; opaque example scenes
  should use opaque canvases. Antialiasing and postprocessing MSAA are separate
  costs. The full-screen star composer/bloom was removed after the first
  measured candidate regressed submission/input timings; its point cloud remains.
- Animation eligibility requires visible document, intersecting scene and no
  reduced-motion preference. Native editing also pauses the glass scenes.
  Stop time-based shader motion as well as mesh rotation. Use seconds from
  `useFrame` delta rather than frame-count increments; mutate refs, not React
  state, in the frame loop. Clamp exceptional resume deltas if continuity needs
  it. Stationary scenes use demand rendering and no recursive invalidation.
- Keep continuous work proportional to visible content. Only visible source
  Sun badges own canvases. Preserve native fields when unloading decorations.
  Test hidden/offscreen/reduced states after finite settling frames.
- Defaults: frustum culling on; no extra shadow/postprocessing passes without
  visible benefit; avoid per-frame allocations, resource creation, scene
  traversal and DOM layout reads. Batch DOM reads before writes. Use resize
  observers for actual size changes, and disconnect observers/listeners/timers.
- Use BufferGeometry, reuse immutable geometry/material resources and use
  instancing for repeated meshes **inside one scene**. Combining isolated
  contexts or instancing unrelated scenes is not a drop-in optimization.
  Preserve silhouettes/UVs/normals and compare any simplified model at its
  largest intended viewing size before shipping it.
- Existing transmission profiles remain bounded: High six samples, 512px
  buffers/backside; Balanced four samples, 256px/no backside. Keep the restored
  `TransmissionSurface` and `GlassObjectCanvas.tsx` optics intact. Refraction
  captures are real additional render passes, not free transparency. Never
  report host draws as GPU-completed or compositor-presented frames.
- Shared glTF resources intentionally remain loader-cached for reuse. Keep
  attribution and source files. Context teardown frees renderer-owned GPU
  resources; JavaScript heap and driver/GPU memory need separate measurements.

## Required evidence

Use repeatable cold and warm profiles, identify browser/OS/renderer, CPU/network
throttles, viewport/DPR, sample count and observation window. Target p75 field
LCP <2.5s, INP <200ms, CLS <0.1 on representative devices. A few lab loads,
synthetic key-to-rAF timings or a Lighthouse score cannot establish those field
percentiles. Report missed targets rather than changing the test conditions.

For a scene change measure actual draw submissions and frame intervals after
warmup, idle draws, active contexts and available heap/resource counters;
capture visible desktop/mobile screenshots. Distinguish request scheduling,
shader compilation, CPU frame time, GPU elapsed time and presentation. Report
missing timing extensions/unsupported memory APIs explicitly. Check failure,
remount, keyboard focus, native values, reduced motion and tab visibility.

Linux Chromium/SwiftShader is a rendering/functional lab check. Linux WebKit is
an engine compatibility check. Neither certifies Safari/Metal, a mid-range
Android GPU, older iPhone thermals, battery use or sustained physical-device FPS.
Use the optional `/performance/` page on physical devices and retain device
reports before claiming those targets. Metrics stay local; no tracking backend
or service worker is introduced by this audit. No deployment is implicit.
