# Calendar star background port

## Requirements and source

Use the existing Three.js background from `interfacethegreatest/Calendar4`, revision `7b7e533e587d4991c97b63259355d1a5e9141616`, in First Light. Source files are `src/components/backgrounds/starsBackground/Model.tsx` and `Scene.tsx`. The calendar's page styles provide a black backdrop.

Preserve the rendered scene: 7,500 stars, radius 200, factor 4, fading, default camera, rotation of both x and y by the source's 0.00025 increment each animation frame, ambient intensity 1, directional intensity 3 at [0, 3, 2], city environment, and bloom with mipmap blur and luminance threshold 1. The optional shooting star remains disabled. Retain the source's red color prop where compatible; do not reinterpret the star shader or add an effect absent from the rendered original.

## Architecture and scope

Port the scene into `src/components/backgrounds/starsBackground/` with strictly typed refs and React 19 compatible Three packages. Mount one decorative, non-interactive canvas behind the app. Load the renderer separately from the research interface. Preserve the original HDR environment using a bundled copy of the same preset asset so GitHub Pages does not depend on the preset's remote host.

Use a black page background and readable dark translucent panels. Keep the layout and research/storage behavior intact. Provide a static black fallback when WebGL is unavailable; honor reduced motion without changing the normal animation. No backend, record-format, or research-feature change is included.

## Acceptance criteria

1. Scene parameters and animation match the source, with compatibility changes documented.
2. The canvas fills the viewport behind the scrolling interface; it neither intercepts input nor appears in keyboard/screen-reader navigation.
3. Desktop and narrow mobile views show the stars and readable, functional forms without horizontal overflow.
4. Existing source → decision → status → reload → export behavior continues to work.
5. Reduced-motion and unavailable-WebGL cases leave a usable app.
6. Type checks, relevant tests, and a Pages-path production build pass. Browser checks confirm actual WebGL rendering and same-origin environment loading.
7. Provide a screenshot and reviewable code before asking to deploy, following the user's original instruction not to deploy without approval. The user has now explicitly approved publication of this update. The coordinator is carrying out the approved publication through the manual Pages workflow; deployment verification is in progress.

## File ownership and sequencing

- Coordinator: package files, environment asset, app mounting, `src/App.css`, base styles, this plan, integration, browser verification, and Git/PR operations.
- Interface agent: only `src/components/backgrounds/starsBackground/` (new scene, model, boundary, and local styles if needed).
- Research documentation agent: only `docs/calendar-stars-provenance.md`, independently documenting the source settings and compatibility considerations.
- Verification agent: after scene implementation, only new tests for background integration in `tests/`; read-only source-fidelity review. Return implementation issues to the coordinator.

The renderer and provenance tasks can run independently against the source snapshot. Tests and integration follow the implemented renderer. No agent may deploy or edit another owner's files.
