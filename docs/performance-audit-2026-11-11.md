# Whole-page rendering audit — 11 November 2026

## Scope and acceptance

Improve measured startup and scene scheduling across the main page and all nine
Canvas implementations, preserving native research controls, saved records,
drafts, keyboard access and the current design. Preserve the main
`GlassObjectCanvas.tsx` byte-for-byte and the restored `TransmissionSurface`
function byte-for-byte. Keep model geometry, source textures, licences, glass
optics, current tint and quality profiles intact. No dependency changes or
deployment are included.

Acceptance: compare fixed-profile cold loads before/after; eliminate eager GPU
imports from the native entry graph; load only relevant scene assets; bound
pixel/render-target budgets; stop inactive automatic rendering; keep native
content usable through delayed/failed GPU loading; pass types, regression tests,
model validation and the gated Pages-base production build. Physical mobile
performance and field Core Web Vitals require separate evidence.

## Architecture and ownership

Native wrappers/settings remain CPU-only. Their intersecting visual slots
request lazy GPU implementations after native first contentful paint. One
shared, cleaned Paint Timing observer gates all ten native wrappers; unsupported
browsers use two presentation opportunities plus a task. The star decorator
also waits for idle. Loader-cached assets remain
shared; Fiber owns renderer teardown. A build manifest budget and a rendered
module inventory expose critical-path and vendor regressions without runtime
instrumentation. [Future scene contract](rendering-performance-contract.md).

Three actual independent agents covered build/import/media analysis and budget
fixtures; all-scene resource/lifecycle analysis and bounded star/Sun-host/DPR
changes; and immutable before/after production-browser measurement artifacts.
File ownership did not overlap. The coordinator owned integration, CPU settings,
draft-panel deferral, final Sun delta conversion, readiness gates, cache retry,
fixture updates, build configuration, documentation and review. Timed browser
runs were serialized with builds/tests; final verification followed integration.

## Concrete findings and changes

1. The main HTML advertised 1,352,879 raw / **391,205 gzip-level-9 JS bytes**.
   `GlassObjectCards → GlassPrimitives → Drei` and
   `SourceSections → NewUserCard → SunScene → Fiber/Drei` bypassed lazy scenes.
   Extracted the unchanged settings/type into `transmission/glassSettings.ts`,
   with compatibility re-exports, and made the source Sun a lazy visual child.
   Native card controls now import no material implementation. Optional glass
   text geometry and transmission retry-loader helpers are deferred too.
2. The offscreen native draft panel immediately created a Canvas and requested
   its HDR. It now activates only when its visual intersects a visible document.
   Activation observers/listeners disconnect after the first request. Native
   content is present immediately; later GPU failure/mount changes retain field
   node, value and focus. Memoized the draft wrapper against unrelated App edits.
3. The full-screen star shader is unlit: its HDR and ambient/directional lights
   had no visual effect. Removed that scene's unused HDR/lights. Preserved 7,500
   points. Installed Fiber already defaults to DPR `[1,2]`; explicit
   `[1,1.5]` lowers the pixel budget. Installed Composer default MSAA was **4**.
   The initial candidate disabled that MSAA but retained bloom; runtime evidence
   did not justify keeping the full-screen pass. The final star scene removes
   the composer/bloom, retains point-sprite fading, and uses `flat` to preserve
   the composer's former NoToneMapping choice. This reduces decorative glow;
   it is an explicit visual/performance tradeoff. The canvas is opaque over its
   black parent and disables redundant renderer AA. Hidden documents, reduced
   motion and native editable focus stop both shader time motion and rotation.
   Timers, idle callbacks, rAF requests and event subscriptions are cleaned up.
4. Shared Moon/Earth resolution was capped at 4. The cap is now **2**, retaining
   event-driven zoom/display updates below the cap. Original textured assets,
   transforms, camera and geometry remain unchanged. Maximum raster detail at
   the old 4× zoom cap is intentionally reduced; this is a performance tradeoff.
5. Generated Sun badges now own renderers only while intersecting in a visible
   document. This bounds context count by viewport rather than the lifetime
   count of generated cards. Native panels remain mounted. Source Sun motion
   changed from `-0.0075/frame` to **-0.45 radians/second**, matching 60 FPS pace
   at any refresh rate. The existing rotation hook stops inactive motion and
   discards the accumulated first-resume delta. Moon and footer loops now wait
   for their first actual draw instead of running while their assets load.
6. Transmission asset retries no longer evict an HDR cache that their procedural
   studio does not use. Context-only retries keep successful loader entries.
   The material, transparent main canvas and procedural studio optics are intact.
7. `npm run build` now enforces recursive static-entry budgets: **120 KiB gzip
   JS, 12 KiB gzip CSS, 350 KiB gzip per emitted JS chunk**. Dynamic imports are
   excluded unless the actual HTML preloads them; shared files count once.
   Missing outputs/dependency records fail the check. `.vite/rendering-modules.json`
   records nonempty rendered modules; transformed/installed files alone do not
   establish shipped code. All dependencies and lockfile remain unchanged.
8. The first gate run exposed **128,227 gzip bytes** after removing eager GPU
   imports. Framer's full `motion` elements still shipped drag/layout projection
   code unused by the application. `calendarMotion/LightMotion.tsx` now supplies
   synchronous `domAnimation` features to reusable `m.div`/`m.button` elements.
   Standalone cards/buttons work without a special application provider or extra
   DOM nodes. Existing variants, explicit height animation and gestures remain;
   source-reveal/focus/integration tests pass. Production syntax explicitly
   targets ES2020/Safari15.4, without claiming hardware or API compatibility.

Initial CSS was only **36,171 raw / 8,520 gzip bytes**. Arbitrarily delaying it
would risk flashes/layout shifts for little saving. There are no CSS font
downloads: the app uses system stacks. Installed Poppins is not imported.
Public source archives total about 62.9 MB but are not initial-transfer costs;
the runtime Earth URL selects the existing 2,043,928-byte icon GLB, not its
24.3 MB archival counterpart. No blanket image recompression, speculative hint
or service worker was introduced. Preserved source GLB licences/attribution.

## Per-scene resource review

All geometries are BufferGeometry-based. Existing isolated torus/panel scenes
have one visible mesh apiece, so merging/instancing those independent contexts
would require a different architecture rather than remove repeated draws.
Frustum culling defaults remain enabled. Ref-based delta motion avoids per-frame
React updates. No new per-frame DOM reads, allocations, resources or state updates
were added. Existing intrinsic-height animation intentionally affects layout on
content changes; this audit does not claim that the browser performs zero layout.

| Scene | Pixel / capture budget | Activity and resource policy |
|---|---|---|
| Stars | DPR≤1.5; 7,500 points; no composer/bloom; flat | Deferred after FCP; demand on hidden/reduced/editing; no unused HDR |
| Source Sun | Fiber default DPR≤2; 5,888 triangles; original 4096×2048 texture | Visible/page-only contexts; delta rotation; reduced demand; immutable cached model |
| Moon | DPR≤2; 68,608 triangles; 2,202,504-byte GLB | Lazy visible activation; first-draw readiness; hidden/offscreen/reduced demand |
| Earth | DPR≤2; 63,488 triangles; 2,043,928-byte icon GLB | Two tiny main indicators; first-draw/visibility gates; shared CPU loader cache |
| Static glass panel | DPR≤1.5; one RoundedBox; local HDR | Initial visible-only request, then demand; native form stays mounted |
| HTML glass scene | DPR≤1.5; plate + wobble accent; local HDR | Separate optional example; first-draw, visibility, focus and motion gates; stable HTML host |
| Transmission example | DPR≤1.25 Balanced /1.75 High; 4/6 samples; 256/512 captures | Optional multi-mesh scene; demand inactive; actual extra transmission/shadow work |
| Main glass object canvas | Same 1.25/1.75 and 256/512 profiles; 18,432 torus /4,620 panel triangles | Existing canvas/material preserved; one mesh each; demand inactive, native controls retained |
| Footer text | DPR≤1.5; extruded local-font geometry | Visible request and first-draw readiness; reduced/hidden/offscreen demand; finite fitting draws |

Fiber 9.8.2 defaults to `powerPreference: 'high-performance'` and releases owned
renderers/caches plus their contexts at unmount. Manual double-disposal would
risk shared assets. Transparent icon/glass canvases retain alpha because page
compositing needs it; an opaque background decorator does not. Scene-specific
owned geometry, textures and material disposal were reviewed alongside the
intentional GLTF loader cache. Source licence assets were not rewritten.

## Measurement protocol

Immutable baseline and candidate production folders use the same deterministic
local server: no-store, gzip level 6 for compressible files, original binary
assets unchanged. Three fresh Chromium contexts each use 390×844, DPR2, touch,
normal-motion preference, CDP **4× CPU slowdown**, **150 ms latency**,
**200,000 B/s download**, **93,750 B/s upload**. Before-scroll observations last
about 12 seconds. Every raw report retains exact request/measurement timestamps,
completed/in-flight distinctions and renderer identity. No GPU layer is hidden.

The baseline LCP candidates were **6,432 /4,472 /5,796 ms** (median **5,796 ms**),
all the hero H1; observed CLS was **0** in each window. Each baseline requested
25 resources and completed **440,703 encoded JS body bytes**, including deferred
modules, by the checkpoint. Five renderers existed: stars, Moon, two Earth marks
and the unnecessary offscreen draft panel. The Potsdamer HDR was requested before
scrolling. Static gzip-level-9 entry size and actual level-6 dynamic transfers are
different measurements and must not be conflated.

The single synthetic baseline source key reached the first rAF opportunity in
**249.4 ms**, second in **449.4 ms**. This is **not field INP** or proof of
compositor presentation. The balanced torus sample submitted nine unique host
frames in 8.04 s; median interval 824.9 ms. These very slow software-renderer
results do not characterize a device GPU. Headless minimization did not make
`visibilityState` hidden; any controlled visibility supplement is labelled
simulated. GPU execution/resident memory are not inferred from extension names.

## Results and limits

The gated Pages-base build passes with **362,016 raw /116,652 gzip-level-9 JS
bytes** in the critical graph, a **70.18%** gzip reduction. Critical CSS is
**36,029 raw /8,476 gzip bytes**. The largest JS chunk is deferred:
**681,480 raw /175,361 gzip bytes**. No budget was raised to achieve a pass.
The rendered-module inventory contains no initial Three/Fiber/Drei/postprocessing
modules, no rendered `stats-gl` or its nested Three0.170 build, and no rendered
Framer drag-control/projection-node implementation. No postprocessing library
module is rendered in any production entry after the star cleanup. This proves what this build
ships; an installed dependency tree alone would not prove it.

The static before/after numbers above both use Node `gzipSync` level9. An early
Python-gzip estimate was389,440 JS/8,517 CSS bytes; different linked zlib versions
produce different compressed streams. That estimate is not mixed with Node
output for the final delta. Actual cold network-body totals use the same Python
level6 server for both variants and are independently recorded by Chromium.

Strict application TypeScript, separate transparent-example TypeScript,
**278 application tests across34 files**, **26 GLB-packer fixtures**, and full
Moon/Earth validation pass (zero validator errors/warnings). All three production
HTML entry points build. There is no lint script. Vite's raw-size chunk advisory
remains for the deferred engine chunk; its measured gzip budget passes. The source
catalog/manifest/ZIP were regenerated and verified against the current source.

The first measured candidate is preserved in the `candidate-a` artifact archive,
explicitly rejected as final. Its median cold LCP improved to4,132ms, but its
single cold input/submission samples regressed. It started the star compositor
sooner than baseline; asset readiness also differed. Those results were not
discarded or reported as hardware FPS. The next candidate removed full-screen
postprocessing and added the actual-FCP barrier, instead of hiding layers in the
test harness. Its final matched runtime/heap comparisons are separate from the
original cold samples.

The final candidate's three fixed-profile cold LCP/FCP observations are
**3,740 /3,136 /3,156 ms**, median **3,156 ms** versus baseline5,796ms
(**45.55% lower**). Observed12s CLS remains **0**. Completed encoded JS bodies
at that checkpoint fell **440,703→377,657 bytes**; requests **25→22** and
created renderers **5→4**. No HDR was requested before scrolling. These encoded
dynamic bytes are separate from the static gzip-level-9 critical graph above.
Browser timing verifies GPU module requests and actual context creation occur
after native FCP in all three final cold runs.

**The <2.5s lab LCP target is not met.** No p75 field result or INP certification
is claimed. A one-run mobile CSS ablation disabled only SVG lens displacement,
retaining blur7px/background/border/radius; it did not show a gain (LCP5,768ms).
The application CSS therefore remains unchanged. Invalid injected-script/report
assertion diagnostics from that experiment are retained separately and excluded
from performance conclusions.

The cold synthetic key's second-rAF opportunity was about357ms versus baseline
449ms. Its first-rAF timestamp preceded event processing and is invalid as an
event-latency measurement; it is retained and excluded, not clamped into a false
improvement. This proxy is not INP or confirmed paint. Unsettled cold frame
samples have different asset readiness and are not used to claim GPU throughput
gains. The original cold offscreen probe scrolled a main element larger than the
viewport, so its offscreen position was not established; its residual-draw
counts are not used to infer an offscreen scheduling defect or pass. Final
matched checks verify actual scroll coordinates and element rectangles.

Matched **ready-state** torus measurements wait for the actual Moon, both Earth
marks, both glass objects and stars to draw, then use Balanced quality with
native controls blurred and the entire page retained. In one8s pair, baseline
submitted **8 frames /8.005s (1.00/s)** versus final **18 /8.004s (2.25/s)**.
Median submission intervals were **833.3→400ms**. There were only7/17 intervals,
so p95 is omitted. These are software CPU/draw submissions, not elapsed GPU
execution, compositor presentation or a physical60FPS claim. Warmup waited
66.0/47.7s under the fixed profile; both scenes were genuinely ready before
sampling. Verified true offscreen rectangles submitted **zero** draws in both.

A separate fresh-browser12s JS-memory pair reported used heap
**8,566,196→8,964,932 bytes (+4.7%)**, allocated heap
**13,819,904→12,771,328 (-7.6%)**, embedder heap2,878,368→4,367,216, and backing
storage2,684,951→2,444,123. Live contexts/canvases were5→4; DOM elements315→310.
Both trials still had loading Moon/Earth assets. No GC was forced. This single
mixed snapshot does **not** establish overall memory improvement or a leak,
and does not measure GPU resident memory.

Actual native focus paused star draws and blur resumed them. Controlled
visibility changes also stopped/restarted them; this visibility check is
explicitly simulated because headless minimization did not hide the document.
Source-button output remained three cards, retained draft value/node identity,
mounted only intersecting Suns and released their canvases at verified scroll0.
The photographic HDR fetched while warming the static panel is legitimate;
an initial diagnostic assertion incorrectly attributed all HDR requests to stars
and was corrected without a product change. There are no application/console
errors in the healthy final checks or horizontal overflow at390/1440 widths.

The final [ready full-page screenshot](previews/performance-ready-main.png) was
captured at1440px with all main models, draft glass, torus, panel and actual3D
footer loaded, controls blurred and verified scrollY0. It uses reduced motion
to hold the composition for inspection; it is not a performance run.
[Header detail](previews/performance-ready-header.png) shows the actual textured
Moon and Earth placement. The [mobile cold-load screenshot](previews/performance-mobile-loading.png)
records the12s window, where native content is usable while models may still load.
[Machine-readable evidence](performance-audit-evidence.json) preserves all timing,
request, readiness, platform and measurement qualifications. Reproduction scripts
and the rejected candidate's evidence remain in
`/workspace/artifacts/first-light-global-performance/`.

The final whole suite used one worker and explicit `--testTimeout=15000` CLI
headroom. A normal5s run hit the previously observed long typing-test timeout,
then its unfinished typing contaminated the next case; the same four-test file
passed alone at the unchanged5s default (slowest case3.28s). No project timeout
configuration was relaxed, assertions skipped or production fix inferred from
that host-dependent fixture timing. Earlier full-run failures from changed lazy
loading/first-draw/elapsed-time contracts were fixed in their actual fixtures;
they were not classified as pre-existing failures.

The raw independent source inventory was completed
before coordinator fixes to Sun time, Moon/footer readiness and retry-cache
eviction; those findings are closed by the changes listed above.

Remaining architecture costs must remain explicit: visited main scenes retain
their renderer resources while demand-idle, and separate contexts duplicate GPU
model/texture uploads despite shared JavaScript loader data. Returning source
badges pay renderer/shader upload costs after unmount. Installed Drei's
file-form Environment disposes its cached HDR on source-Sun unmount, which can
make retained siblings upload again. The multi-mesh showcase captures more work
than the isolated main objects. A pooled/shared Canvas, model/texture derivatives
and revised quality defaults need separate visual and representative-device
measurements; this audit does not certify them as optimal.

Linux Chromium uses ANGLE/SwiftShader with no physical Apple/Android GPU. CDP
slowdown is not a calibrated older phone. No physical Safari/Metal, mid-range
Android, thermal/battery, sustained hardware FPS or p75 field LCP/INP/CLS result
is available. Native memory APIs cannot establish total driver/GPU residency.
The existing optional `/performance/` device page is suitable for the user's
Apple-device follow-up after an approved publication. No deployment or commit
is implied by local verification.

The remaining acceptance work is therefore concrete:

1. Profile the remaining native startup path on representative hardware. GPU
   startup is now demonstrably after FCP, so more deferral of Three.js cannot
   solve that first-paint gap. The application still client-renders its native
   shell. Build-time prerendering is a potential follow-on, with explicit saved
   workspace, pre-hydration draft, focus and hydration regression checks; it was
   not introduced as a shortcut to improve a score.
2. Obtain real older-iPhone/mid-range-Android reports for sustained frame pacing,
   native interaction/Event Timing, thermals and memory pressure. Establish field
   p75 CWV separately. An8s software pair and three cold loads are insufficient
   for a percentile or60FPS certification.
3. Measure before changing context pooling, source-Sun HDR ownership, or model
   payload/LOD. These are the explicit resource costs above. Preserve originals
   and licences, validate any derivative and compare its largest intended view.
   Do not infer download compression from GLB packaging or swap in a low-detail
   fallback to produce an apparently faster rendering measurement.
