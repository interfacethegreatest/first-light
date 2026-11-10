# Earth resolution parity

## Requirements and isolated change

Improve the Earth indicators when zooming while retaining their 12px/14px layout, framing, lighting, opacity, rotation, loading/failure behavior, source geometry and texture. Deployment is authorized. The only application source change is in [EarthMarkCanvas.tsx](../src/components/misc/EarthMark/EarthMarkCanvas.tsx).

Both the Moon and runtime Earth use 1024×512 textures. The renderer differed: Earth used `dpr={[1, 1.5]}`, while the Moon uses an event-driven resolution hook. Earth now imports that same existing hook; the Moon and the hook are unchanged.

```diff
 import EarthModel, { type EarthRotationAxis } from './EarthModel'
+import { useMoonResolution } from '../MoonMark/useMoonResolution'
-const dpr: [number, number] = [1, 1.5]
 // Inside EarthMarkCanvas:
+  const dpr = useMoonResolution()
```

The existing `dpr={dpr}` Canvas prop now receives a number derived from display DPR and mobile pinch scale, bounded to 1–4. Desktop zoom is represented by display DPR; it is not multiplied by a window-size ratio. The hook listens for resize, visual-viewport and resolution-query changes, releases listeners, and does not poll or start an animation loop. Reduced motion and visibility continue to control rendering separately.

This increases the drawing buffer rather than enlarging or stretching the HTML element. It does not manufacture texture detail, remove the renderer's 4× ceiling, or replace the original model with a generic sphere. No dependencies or asset bytes change.

## Ownership and acceptance

The coordinator owns the one Canvas edit, documentation, source snapshots, final checks and release. The test agent owns Earth resolution integration tests and the prior Canvas expectation. The browser agent owns temporary before/after scripts and artifacts. The two assignments are independent; production rebuilding waits for capture of the old build, and after checks wait for the new build.

Acceptance requires actual native canvas dimensions increasing with display/pinch zoom, the original CSS boxes remaining 12px/14px, the same textured models and camera framing, working controls, preserved motion gates, no new overflow, and passing relevant tests/TypeScript/production checks. Browser zoom must use real browser controls/protocol where available; a scripted hook fixture must be labelled separately. Physical Safari/GPU performance is not established by software Chromium.

## Verification

Strict TypeScript, the Pages-path production build, and all **244 tests across 30 files** passed. The first full test run overlapped the baseline browser work and one existing native-workflow test exceeded its five-second deadline; a quiet single-worker rerun passed all tests without changing that workflow or its timeout. The 25 focused Earth/Moon resolution tests also passed. The existing bundle-size advisory remains; generated source snapshots verify successfully.

The actual application was compared before and after using fresh Chromium/SwiftShader contexts at device DPR 1 and 2 and real CDP `Emulation.setPageScaleFactor` pinch values 1, 2 and 4. These are native browser viewport-scale events, not CSS transforms or manually dispatched resize events. Both scenes rendered their real textures throughout.

| Device DPR | Pinch scale | Previous Earth buffers (12px / 14px markers) | New Earth buffers | Moon buffer, unchanged |
| ---: | ---: | --- | --- | ---: |
| 1 | 1 | 12 / 14 | 12 / 14 | 112 |
| 1 | 2 | 12 / 14 | 24 / 28 | 224 |
| 1 | 4 | 12 / 14 | 48 / 56 | 448 |
| 2 | 1 | 18 / 21 | 24 / 28 | 224 |
| 2 | 2 | 18 / 21 | 48 / 56 | 448 |
| 2 | 4 | 18 / 21 | 48 / 56 | 448 |

All buffer values are native canvas pixel widths; heights match. Earth CSS boxes remained 12px/14px in every case. Compare the native 4× browser screenshots [before](previews/earth-resolution-before.png) and [after](previews/earth-resolution-after.png). The Moon, labels and framing remain the same; Earth no longer stretches the old small buffer at this zoom. The image was not sharpened or composited.

Both phases confirmed the same 190,464-index Earth mesh, 1024×512 texture and one shared 2,043,928-byte GLB request per context, SHA-256 `b4e0d0bea753e317578e3e6e90d06ca3d7426cb45deece70a37c33cc2a02b663`. Canvas identity, native home/export/labels, source draft, 390px layout, normal rotation, actual offscreen pause and reduced-motion pause passed. There were no healthy page/console errors. Raw reports are `/workspace/artifacts/first-light-earth-resolution/baseline.json`, `after.json` and `comparison.json`.

These checks verify drawing-buffer resolution and behavior in Linux Chromium, not physical Safari, Apple GPU pacing or unlimited zoom sharpness. The existing 4× cap still applies, including when display DPR multiplied by pinch scale exceeds four.
