# Calendar interface motion: provenance and mapping

First Light reuses rendered interface motion from [`interfacethegreatest/Calendar4`](https://github.com/interfacethegreatest/Calendar4) at revision [`7b7e533e587d4991c97b63259355d1a5e9141616`](https://github.com/interfacethegreatest/Calendar4/commit/7b7e533e587d4991c97b63259355d1a5e9141616), the same pinned source as the star background. The reviewed source files are:

- [`LoginCard.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/LoginCard/LoginCard.tsx)
- [`TiltCard.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/cards/TiltCard/TiltCard.tsx)
- [`slideButton.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/buttons/auth/slideButton.tsx)
- [`slideButtonSubmit.tsx`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/buttons/auth/slideButtonSubmit.tsx)
- [`buttonStyle.module.css`](https://github.com/interfacethegreatest/Calendar4/blob/7b7e533e587d4991c97b63259355d1a5e9141616/src/components/buttons/auth/buttonStyle.module.css)

See [the motion port plan](calendar-motion-plan.md) for requirements, component ownership, and acceptance criteria. Source fidelity was reviewed independently, then the integrated port was checked in the browser as recorded below.

## Rendered effects and timing

| Effect | Pinned source behavior | First Light mapping |
| --- | --- | --- |
| Card entrance | Cards start at x `-100vw` and enter to `0`, using a spring with stiffness `70` and damping `20`. LoginCard triggers its entrance on mount; TiltCard initially targets `0`. | `CalendarPanel` wraps each of the two existing research workspace panels with the same normal-mode entrance. |
| Pointer tilt | `react-parallax-tilt` uses `scale={1}`, `tiltMaxAngleX={2}`, and `tiltMaxAngleY={2}`. | The panel's inner tilt wrapper retains scale `1` and maximum angles of 2°. |
| Rolling labels | On hover, the default label moves from `translateY(0)` to `translateY(-60%)`, with opacity `1 → 0`. The alternate label moves from `translateY(-60%)` to `0`, with opacity `0 → 1`. Both transform and opacity transition over `0.3s ease`. | `CalendarButton` provides two decorative visual labels for Add source, Add decision, and Export while keeping one stable accessible name. |
| Hover background | The submit button changes from `rgb(48, 48, 48)` to `rgb(56, 137, 110)`; background-color transitions over `0.3s ease`. | Reuse the green hover target and timing within First Light's existing button styles and dimensions. |
| Button border | Both button components apply a `2px solid` motion border, cycling the four RGBA colors below over `10` seconds, with `easeInOut`, `repeat: Infinity`, and `repeatType: "mirror"`. | Apply the same border colors and normal-mode animation settings to `CalendarButton`. |

The button border keyframes, in source order, are:

```text
rgba(159, 158, 158, 0.7)
rgba(159, 158, 158, 0.5)
rgba(130, 129, 129, 0.35)
rgba(189, 188, 188, 0.2)
```

The animated border is visibly applied through the source buttons' `style={{ border }}`. TiltCard also declares a separate five-color border animation and applies it to its conditional icon holder, not the outer card. Do not infer an animated outer-card border from that declaration. Neither the icon-holder behavior nor an animated card border is part of this mapping.

## Compatibility and host adaptations

The source imports Framer Motion and `react-parallax-tilt`. First Light uses Framer Motion `11.18.2` (within Calendar4's `^11.3.21` range) and `react-parallax-tilt` `1.7.352`, both pinned in the manifest and lockfile. Both declare React 19 support; `npm ls` confirms compatible installed versions. Calendar4's minimum tilt version `1.7.232` declares support through React 18, so the newer 1.7 release supplies compatibility while retaining the explicit source tilt parameters. The source application's Next.js, authentication, and routing setup are not transferred.

The following are deliberate First Light integration requirements rather than claims about the source:

- Keep existing panel layout, sizing, semantic sections, button actions, field labels, and research records. Source absolute positioning, fixed button placement, and Calendar authentication/navigation behavior are not transferred.
- Preserve native button type and disabled semantics. Give each button a stable accessible name; hide both changing visual labels from assistive technology. Interactions must work before animations finish and without hover.
- Disable tilt on touch/coarse pointers and while a panel contains focused form controls. Keep focused fields steady.
- Honor reduced motion by suppressing entrance travel, tilt, rolling labels, and animated borders. Changing the preference must preserve form values, focus, and mounted control identity.
- Clean up media-query listeners and animation controls. Keep the already published star scene and its fallback behavior unchanged by this interface-motion port.

## Verification record

Verified locally on 2026-11-09:

- The coordinator reviewed the implementation and collected independent component, provenance, and verification work with separate file ownership. The verification agent confirmed the source spring, tilt, label transitions, colors, and border cycle match the pinned snapshots.
- `npm test` passed all 44 tests, including 10 new native-button, preference, cleanup, and focus/value-preservation checks. `npm run typecheck` and `VITE_BASE_PATH=/first-light/ npm run build` passed. The source star-scene files and research persistence layer were not modified.
- Chromium `156.0.8078.79` observed actual spring movement from x `-1348.54` through `-875.28` to `0` in a 1440-pixel viewport. Pointer tilt produced nonzero rotation components; focusing a field reset the panel to a steady transform.
- The rolling default label reached opacity `0` and a negative y transform, while its alternate reached opacity `1`. Hover background resolved to the source `rgb(56, 137, 110)`. Computed border colors changed during the source's slow cycle.
- Accessible button names remained stable. Keyboard submit and export worked, disabled decision creation stayed disabled before a source existed, and the source → decision → status → reload → JSON export flow passed with exactly one source and one decision.
- Live reduced-motion changes stopped new motion and preserved the same input node, value, and focus. The border remained static in reduced motion. A touch/coarse-pointer context kept tilt disabled and the default label visible.
- Viewports 1440, 768, 390, and 320 pixels had no horizontal page overflow during sampled entrance frames or after settling.
- A separate preview with the actual WebGL star background rendered without application JavaScript errors and was recorded. Frame measurements used the decorative-chunk failure fallback to isolate interface movement from shader compilation; the recorded preview used the real scene.

Review artifacts: [animation video](previews/calendar-motion-demo.mp4), [desktop](previews/calendar-motion-desktop.png), and [mobile](previews/calendar-motion-mobile.png). Demo records are explicitly synthetic and are not seeded into the application.

The entry bundle grows by about 43 kB gzipped to include the two animation libraries; the separate 3D scene payload is unchanged. The border cycle runs continuously in normal-motion mode, as in the source. Hardware and browser animation performance vary; verification used Chromium, including software WebGL for the combined preview, rather than a range of physical mobile devices.

## Published verification

The user explicitly approved publication after review. [PR #3](https://github.com/interfacethegreatest/first-light/pull/3) was merged as `6dd5152b126bfd4a84f38469b8e06647f2a68ab4`. [Pages workflow 42628705528](https://github.com/interfacethegreatest/first-light/actions/runs/42628705528) passed the checks, all 44 tests, build, and deployment on 2026-11-09.

Live application: <https://interfacethegreatest.github.io/first-light/>.

The verification agent independently confirmed the live entry JavaScript and CSS contain both Calendar animation markers, distinguishing this release from the previous stars-only interface. The HTML, entry script, stylesheet, favicon, and dynamically loaded star chunk returned HTTP 200 with correct content types. The HDR still had 1,540,678 bytes and the original SHA-256 `7afe4c2f9700ee78c7477c53fa355463d7dda1fdede401432d6b5f9ff0a95696`.

The coordinator repeated the interface checks on the actual HTTPS site in Chromium: entrance movement from x `-1440` through `-1433.3` to `0`, nonzero pointer tilt with steady focused fields, rolling-label opacity/transform, the source green hover color, changing border colors, keyboard submit/export, disabled decision creation, source → decision → status → reload → export, and four responsive widths. Live reduced-motion toggles preserved the input node, value, and focus; borders stopped. A touch/coarse-pointer context kept tilt disabled. All passed. Entrance checks waited for an observed rendered frame rather than assuming the hosted page could advance within a fixed delay.

These interface frame measurements isolated the decorative chunk, as in the local verification. A separate combined check then rendered the actual live 7,500-star scene with software WebGL, observed 3,822 lit framebuffer pixels with no GL error, and confirmed HTTP 200 for the same-origin environment. Source → decision → status → reload → export and all four widths passed with that real scene active and no application JavaScript errors.

Test records remained in fresh browser contexts; no user records were uploaded or changed. Later documentation-only commits do not trigger another deployment because the Pages workflow is manual. The device-performance and browser-coverage limits above still apply.
