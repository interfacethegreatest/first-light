# Browser and device performance checks

## Scope and acceptance

Keep the current page design, glass optics/tint/lighting, geometry, rotation speeds, saved records and exports unchanged. Remove demonstrated unnecessary rendering, verify the available WebKit engine, and provide a reproducible measurement on the user's Apple device before claiming Safari/device smoothness.

Acceptance includes real textured/mesh rendering rather than fallback-only success, working native controls and scrolling layout, reduced-motion/visibility pauses, no new shader errors, and no glass rendering caused by unrelated form typing. Measurements identify their browser/platform/renderer and distinguish actual host-draw submissions from animation callbacks and GPU execution time.

## Available environment

The execution workspace is Linux and exposes no `/dev/dri` device or connected Apple-device testing service. Chromium reports ANGLE/SwiftShader. The official Playwright WebKit build runs on Debian WPE; it is a useful engine compatibility check, not macOS Safari, iOS Safari, Metal GPU or physical-phone testing. In this build its user agent and debug renderer can advertise Mac/Safari/Apple GPU while `navigator.platform` identifies Linux. Those strings alone are not hardware evidence.

The user has offered to run the check on an Apple device. That result remains pending until the device report is returned.

## Changes

- Memoize the private glass-card boundary so unrelated App field updates do not reconcile its renderer.
- Keep the studio Environment children stable unless light intensity changes. Drei's `frames={1}` limits scheduled captures, but changing its children also recaptures six cube faces in a layout effect. Optical edits do not require a new studio lighting map.
- Observe each source Sun's existing canvas and use demand rendering offscreen, in hidden tabs or under reduced motion. Preserve its original model, texture, camera, lights, environment and visible interaction. No extra layout wrapper is added.
- Add an optional `/performance/` page. The normal App does not import or load this diagnostic.

The device page loads the current deployed App in an inert same-origin frame, installs observation before its module runs, and measures the torus/panel sequentially at Automatic and Balanced quality. It excludes refraction-buffer draws and counts unique animation-frame timestamps containing an actual host-mesh draw to the default framebuffer. Quality settings are restored; no optical controls, source records or research inputs are edited. Hidden tabs, reduced motion, unavailable renderers and insufficient samples receive explicit statuses. The report stays local until the user chooses to copy it; there is no metrics backend.

## Apple-device procedure

1. Open <https://interfacethegreatest.github.io/first-light/performance/> in Safari on the actual device.
2. Optionally enter a device label such as the phone/Mac model and OS version.
3. Keep the tab visible and orientation/zoom stable, then tap **Run device check**. Four six-second samples run after scene loading and shader warmup.
4. Tap **Copy report** and return it to the coordinator, together with whether the motion and scrolling looked smooth. If clipboard access is unavailable, select and copy the report text.

Automatic can already select Balanced on a phone. Matching effective profiles should not be treated as different quality settings. Submitted frames per second and observed frame intervals help assess pacing, but do not measure GPU completion time or prove compositor presentation. Review the actual hardware report and visual observation together; do not infer a 60 FPS guarantee from a compatibility pass.

## Ownership

The interface agent owns the Sun visibility change and focused tests. The verification agent owns the temporary WebKit/browser artifacts and tooling prefix. The diagnostic agent owns the optional page/probe and its instrumentation tests. The coordinator owns memoization, regression tests, final measurements, documentation, catalog and deployment. Browser timing runs are serialized to avoid competing GPU/CPU workloads.

## Verification

The production configuration (`VITE_BASE_PATH=/first-light/ npm run check`) passed strict TypeScript, 225 application tests across 26 files, all 26 GLB-packer tests, Moon validation with zero errors/warnings, and both production entry builds. There is no lint script. The existing large-bundle advisory remains; no dependency versions or model assets changed.

In the actual main App under Linux Chromium/SwiftShader, one unrelated source-title change previously caused 40 extra GL draw calls per glass card (39 offscreen capture draws and one main draw), 80 total. After the memoization fix the same operation caused zero extra draws on both cards. Offscreen idle also produced zero draws. This demonstrates removal of work; noisy automation input latency and very low software-renderer frame rates do not establish faster typing or device smoothness. Root artifacts: `/workspace/artifacts/first-light-performance/before.json` and `after.json`.

Official Playwright 1.62 WebKit 26.5 (Debian WPE build 2336) rendered the actual textured glass objects and 3D footer on the normal main page. Desktop, 390px and 320px layouts, native controls, desktop wheel scrolling, rotation, reduced-motion/focus/offscreen/controlled-hidden pauses passed. The healthy runs recorded no JavaScript, console, HTTP or GL errors. Coarse-pointer taps passed; a physical mobile swipe was not tested. The WebKit host library-cache checker does not recognize the user-owned library prefix; actual ELF dependencies and dynamic loads were checked before launching the same official executable through Playwright's supported explicit executable-path option. No browser binary, sandbox policy or system libraries were modified.

An eight-second WebKit software sample submitted about 3.15 host frames/second per card, with a median interval around 238ms and p95 around 655ms. These slow software submissions are a test-environment result, not physical Apple GPU evidence. The engine advertises Apple GPU strings despite running on Linux, which is why the diagnostic records platform/device context and avoids claiming hardware based on renderer text. Full reports and screenshots are in `/workspace/artifacts/first-light-webkit/` (`compatibility.json`, `report.json`, `webkit-main-desktop.png`, `webkit-main-390.png`, `webkit-main-320.png`).

The probe's six focused tests cover host/FBO filtering, duplicate timestamps, zero/insufficient frames, interruptions and cleanup. A real-browser check caught that Fiber places the Canvas test attribute on its wrapper rather than the native canvas; the probe and fixture were corrected to use the wrapper ancestry and the focused suite passed again.

The complete device-page workflow passed in Chromium at 390px with touch enabled: all four real six-second samples collected submitted frames, both requested profiles correctly resolved to Balanced for the coarse pointer, Copy report worked, the synthetic saved-data sentinel remained byte-for-byte unchanged and absent from output, and the frame unloaded afterward. There were no page errors or horizontal overflow. A second run with Reduced Motion produced an explicit interrupted report with no measurements. Evidence: `/workspace/artifacts/first-light-performance/device-check-e2e.json` and `device-check-mobile.png`. These are functional checks on a software renderer, not Apple performance results.

The diagnostic also passed a bounded 390px/coarse-pointer WebKit check: its first real six-second sample collected host draws, Stop returned an honest partial report during the next sample, the frame and all canvases unloaded, controls restored, and Reduced Motion skipped renderer loading. No instrumentation patch failures or page/console/HTTP errors occurred. Evidence: `/workspace/artifacts/first-light-webkit/device-page-check.json` and `webkit-device-stopped.png`. The full four-sample workflow was run in Chromium; WebKit deliberately stopped after one measured sample to verify cancellation.

Real Apple-device performance remains pending the user's report. In particular, Safari touch scrolling, thermals, battery use, Metal GPU behavior, compositor frame presentation and sustained device pacing have not been certified here. Existing automatic mobile quality selects Balanced; the optional check reports requested and effective quality rather than implying two different phone profiles.
