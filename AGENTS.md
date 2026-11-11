# First Light performance work

Read `docs/rendering-performance-contract.md` before changing page rendering or
adding a Three.js scene. Keep native content usable independently of WebGL.

- Keep native wrappers/settings CPU-only; use type-only GPU imports. New scenes
  need the shared native-paint gate, visible/page-visible activation, bounded
  DPR/capture buffers, reduced-motion handling and cleaned resource ownership.
- Stop inactive frame loops and time-based shaders. Shared loader-cache assets
  must survive another instance unmounting. Do not dispose shared resources to
  improve a counter while breaking another scene.
- Use `npm run build` for the production bundle budget. Keep manifest/module
  evidence and compare equivalent profiles/readiness before claiming gains.
  Run appropriate type, lifecycle, model and native-form regressions.
- The current main `GlassObjectCanvas.tsx` and `TransmissionSurface` optics were
  explicitly preserved. Do not change them incidentally during another fix.
- Software Chromium/WebKit, render submissions, JS heap and physical device GPU
  performance are different measurements. State missed targets and unavailable
  evidence. Never use hidden layers or working fallback content as proof of
  successful model rendering or smooth device performance.
- Keep changes local unless publication is authorized. An explicit deployment
  request supplies that authorization; do not invent another approval step.
