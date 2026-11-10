# MoonMark axis rotation

This records the Moon integration checks before the transmission gallery was added. The [combined release notes](transmission-scenes.md) contain the latest aggregate verification.

## Requirements and acceptance

Enable subtle rotation of the actual header Moon, preserving its textured model, camera, lights, transparency, glow, dimensions, layout and `First Light home` link to `#top`. Expose an axis and speed for reuse. Rotation must use elapsed frame time, pause for reduced motion, hidden tabs and offscreen views, and preserve a stationary default for other `MoonMark` consumers. No dependencies or deployment are needed.

Acceptance: the header visibly rotates around Y; X/Y/Z produce the same angular displacement for equal elapsed time at 30/60/120 FPS; sign changes direction; speed zero is stationary with demand rendering. Props must reach the actual model. Existing home/keyboard actions, visibility/reduced-motion pauses, source model transforms and load/preload URLs remain intact.

## Implementation

```tsx
<MoonMark
  size={112}
  animate
  rotationAxis="y"
  rotationSpeed={-0.12}
/>
```

The actual header uses the same options through `moonMarkTemplate.render()`. Its surrounding home anchor and export control are unchanged. The reusable `MoonMark` default remains `animate={false}`; the header explicitly opts in.

`rotationAxis` accepts `"x"`, `"y"` or `"z"` and defaults to Y. `rotationSpeed` is radians per second and defaults to −0.12: approximately one turn every 52.36 seconds. Positive values reverse direction. A speed of zero holds the current angle and selects demand rendering.

The model updates its own parent group inside Fiber's frame callback:

```tsx
useFrame((_, delta) => {
  if (animate && rotation.current) {
    rotation.current.rotation[rotationAxis] += rotationSpeed * delta
  }
})
```

`delta` is elapsed seconds. This mutates the Three.js transform without setting React state each frame. The parent-group axis keeps the original mesh X alignment (`-Math.PI / 2`), geometry, material and composed `0.028 * 100` scale intact. The default is a spin in place, rather than an orbit around the header.

`MoonMark` applies the existing viewport, page visibility and reduced-motion policies before forwarding `animate`. `MoonMarkCanvas` uses `always` only while rotating, otherwise `demand`. Axis and speed pass through both layers to `MoonModel`. Type-only imports preserve the lazy canvas boundary. Rotation resumes on the existing object rather than remounting or resetting its angle. This remains decorative motion, with no astronomical phase/date calculation.

## Scope and ownership

The coordinator owns the four Moon/header source changes, integration, browser checks and sourcebook regeneration. A verification agent owns only the two Moon test files. A separate documentation agent owns only the glass/panes guide. Source sections, glass design, workspace data, assets and dependencies remain unchanged by this task. Earlier uncommitted glass/source-batch work is retained.

## Verification

`VITE_BASE_PATH=/first-light/ npm run check` passes: 179 application tests across 20 files, 26 packer tests, original/converted Moon validation with zero errors or warnings, strict TypeScript and the multipage production build. The existing large-chunk advisory remains; no lint script is configured. No dependencies, model assets, glass styles or workspace schema changed.

The two Moon test files contain 30 passing cases, including X/Y/Z at 30/60/120 FPS, custom signed/zero speeds, prop forwarding through the actual Canvas boundary, demand rendering at zero speed, header opt-in, visibility/reduced-motion gates, shared-resource/transform integrity and native home/focus/draft behavior.

The [actual main-page browser check](moon-rotation-browser-verification.json) passes with Chromium/SwiftShader. Screenshots of the central Moon surface change while spinning, then remain identical once reduced motion settles. Scrolling the Moon offscreen pauses it; returning resumes it. The native home link still works with Enter and preserves the source-title draft. One Moon canvas is present, with no page errors. See the [header capture](previews/moon-rotation-header.png).

These are functional software-rendering checks, not hardware GPU performance measurements. Safari remains untested. The [component sourcebook](component-catalog.md), ZIP and manifest have been regenerated to include the current rotation API.

The user subsequently approved publishing this work together with the glass/source-batch updates and transmission studies. The combined release uses the existing manual GitHub Pages workflow.
