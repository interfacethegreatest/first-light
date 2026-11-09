# Calendar interface animation port

## Requirements and source

The user clarified that interface animations should come from their Calendar GitHub project. Reuse the rendered motion patterns in `interfacethegreatest/Calendar4` revision `7b7e533e587d4991c97b63259355d1a5e9141616`, the same source as the star background. The exact source snapshots are available in `/tmp/first-light-calendar-motion-reference/` during implementation; permanent provenance links belong in the companion document.

- Card entrance: `LoginCard/LoginCard.tsx` and `TiltCard/TiltCard.tsx` use x from `-100vw` to `0`, with spring stiffness 70 and damping 20.
- Card tilt: those cards use `react-parallax-tilt`, scale 1, maximum x/y angles 2 degrees. Use these values on the two research workspace panels.
- Action buttons: `buttons/auth/slideButtonSubmit.tsx`, `slideButton.tsx`, and `buttonStyle.module.css` render label translation by -60% with opacity transitions lasting 0.3s ease, green hover background `rgb(56, 137, 110)`, and a 2px border cycling four source RGBA colors over 10 seconds with easeInOut, infinite mirror repeats.
- Preserve First Light's form actions, data, page layout, field labels, persistence, and the already-published Calendar star scene. Reuse animation behavior without porting authentication, calendar routing, loading spinners, or commented-out effects.

## Architecture

Create reusable `CalendarPanel` and `CalendarButton` components under `src/components/calendarMotion/`. Use React 19-compatible versions of the source libraries. Panels wrap the existing semantic sections: a spring entrance wrapper contains a scale-1 tilt wrapper. Buttons preserve their native type, disabled state, handler, and stable accessible name while the two visual labels animate. Stable wrappers and DOM identity must preserve input values and focus when motion preferences change.

Use reduced-motion preferences to stop spring travel, tilt, and border/label animations. Disable tilt for touch/coarse pointers and keep focused form controls steady. Clean up animation controls and media listeners. Labels must remain readable without hover; no interaction should depend on completing an animation. The app and layout remain usable without WebGL as before.

## Acceptance criteria

1. Source spring, tilt, label-transition, color, and border timings are traceable and preserved in normal motion mode.
2. The two workspace panels enter and gently tilt; Add source, Add decision, and Export buttons expose their existing actions with rolling visual labels and source border motion.
3. Disabled buttons do not submit; accessible names and keyboard behavior remain stable during label changes.
4. Pointer movement cannot move focused fields. Touch/coarse pointers do not tilt panels. Reduced motion disables the new animation and live preference changes preserve form values and focus.
5. No horizontal overflow appears at 1440, 768, 390, or 320 pixels, including during entrance. Existing source → decision → status → reload → export behavior passes.
6. Existing tests, relevant new behavioral checks, TypeScript, and the Pages-path build pass. Browser checks verify actual movement, motion suppression, and interaction. Capture a short animation preview.
7. Prepare a draft PR and reviewable preview. Obtain the user's approval before merging or dispatching Pages for this new update. The user explicitly approved publication after review. Workflow `42628705528` successfully published merge `6dd5152`; production checks are recorded in the provenance document.

## Ownership and sequencing

- Coordinator: packages/lockfile, `src/App.tsx` integration, this plan, preview artifacts, browser checks, review, and Git/PR work.
- Interface agent: only `src/components/calendarMotion/`, implementing the component/hook/style contract below.
- Research documentation agent: only `docs/calendar-motion-provenance.md`, documenting source links, exact values, adaptation, and verification status.
- Verification agent: after components are complete, only `tests/calendar-motion.test.tsx`, plus read-only source-fidelity and accessibility review.

Component implementation and provenance can proceed independently. Root integration follows the agreed contract; tests and browser checks follow implementation. Avoid overlapping edits. No agent may install packages, commit, publish, deploy, or delegate.

## Component contract

- `CalendarPanel.tsx` default export takes `{ children: ReactNode }`. It wraps the unchanged section in `.calendar-panel-entrance` and `.calendar-panel-tilt` wrappers, using the source entrance spring and tilt values. Wrappers stay mounted when motion preferences change. Keep width/min-width safe for the current CSS grid; do not change the semantic section or children. Steady focused controls and disable tilt for coarse pointers.
- `CalendarButton.tsx` default export takes ordinary motion-compatible button props plus `label: string`, `hoverLabel: string`, and optional `icon: ReactNode`. Root supplies `className` (`button button-primary` or `button button-secondary export-button`), `type`, handler, and disabled. Stable `aria-label` is the primary label; both visual copies are decorative. Default label remains readable on touch and reduced motion. Use source rolling-label/border animation, preserve host button dimensions, and do not remount or clone the action handler.
- Shared styles/hooks live in the same owned directory. Import their CSS within the components so root only imports the two TSX files. Existing First Light CSS is outside this assignment.
