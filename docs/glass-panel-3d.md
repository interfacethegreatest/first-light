# Reusable 3D glass panel

`GlassPanel3D` is a native `div` with two layers: a decorative, transparent Three.js canvas and ordinary HTML content above it. Its height follows its children. It inherits the application's 1px border, 6px radius, text colour and font. A local smoky surface adapts the attached dark frosted UI reference without changing the shared glass tokens or replacing existing application panes.

`GlassMaterial.tsx` supplies the shared optical material for Drei's `RoundedBox`: pale gray `#cdd2d9`, transmission 0.95, thickness 0.4, roughness 0.2, IOR 1.45, environment intensity 0.4, metalness 0, clearcoat 0.75 and clearcoat roughness 0.18. Compared with the original white, smooth material, the tint and softer, weaker reflections give a calmer frosted surface. A checked-in HDR provides reflections without changing the page background or requesting a remote environment preset.

The local CSS surface combines `rgba(44, 45, 49, 0.44)` backing, `blur(18px) saturate(1.15)`, a faint diagonal gloss, an inset white edge and a soft outer shadow. These overrides apply only inside this component; the wider application's colours, radius and border widths are retained. The decorative canvas blends at 0.16 opacity while HTML content and focus indicators stay fully opaque. WebGL refraction applies to scene objects and the environment; it cannot refract arbitrary HTML behind the canvas. CSS backdrop blur supplies that effect for the DOM. The isolated example includes preview-only background lights to make this transparency visible on an otherwise black page.

The same material can be used inside the user's sphere mesh:

```tsx
import GlassMaterial from '../components/glass-panel-3d/GlassMaterial'

<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <GlassMaterial />
</mesh>
```

## Use

```tsx
import GlassPanel3D from '../components/glass-panel-3d/GlassPanel3D'
import { useGlassPanelMount } from '../components/glass-panel-3d/useGlassPanelMount'

export default function ResearchPanel() {
  const { isMounted, mount, unmount, toggle } = useGlassPanelMount()

  return (
    <>
      <button type="button" onClick={toggle} aria-pressed={isMounted}>
        Toggle 3D glass
      </button>
      <GlassPanel3D mounted={isMounted} aria-labelledby="research-title">
        <h2 id="research-title">Research notes</h2>
        <p>These are real HTML children, above the 3D glass.</p>
        <label>Draft<input name="draft" /></label>
      </GlassPanel3D>
      <button type="button" onClick={mount}>Mount scene</button>
      <button type="button" onClick={unmount}>Unmount scene</button>
    </>
  )
}
```

`mounted` defaults to `true`. The hook's callbacks are stable; `mount` and `unmount` are idempotent. Only the GPU layer unmounts. Native children, uncontrolled inputs and their focus remain in place. Pass native div props, `ref`, `className` and `style` normally; `contentClassName` styles the inner HTML wrapper. To remove the entire panel instead, conditionally render `<GlassPanel3D>` in its parent as with any React component.

## Lifecycle and fallback

The canvas is lazy-loaded on the client after a WebGL API check. A local error boundary and context-loss handler retain the CSS glass surface and all HTML content if rendering or the local HDR fails. Turning `mounted` off and on starts a fresh layer attempt. Shared environment data stays cached; Fiber removes the renderer and disposes each layer's owned mesh geometry/material on unmount.

The scene is stationary and uses demand rendering with a bounded 1–1.5 pixel ratio. Resizing or changing content dimensions requests a new frame; there is no perpetual animation loop. The decorative layer cannot intercept pointer input or touch scrolling. It adds no focus target or accessible duplicate of the HTML content.

## Isolated example

`GlassPanelExample.tsx` demonstrates the hook, growing content and an uncontrolled draft input. It is not imported by `App.tsx`. With the development server running, open `/examples/glass-panel-3d/`. No dependency or lockfile changes are needed; the installed React/Fiber/Drei/Three versions are retained. No deployment is performed.

The initial component passed the full 149-test suite across 16 files. For this appearance refinement, all seven focused tests were rerun and pass for the public hook, native div props/ref/events, input/node/focus retention, disabled layers, stale callbacks, remounts and local fallback. TypeScript and both the application and standalone example production builds pass. The application builds with `/first-light/`; its JS/CSS asset hashes still match the preceding footer-only build (`index-r8Z0IJLl.js`, `index-BQct1Xpe.css`, `FooterTextCanvas-D39cuvoH.js`), confirming this component adds no runtime change to the current page. No package or lockfile changes were made. Vite's existing large-chunk advisory remains; no lint script is configured.

The current [smoky-glass browser report](smoky-glass-browser-verification.json) checks the actual standalone production example in Chromium with software WebGL and compares its layout/typography against the preceding implementation. The local 1,540,678-byte HDR returns 200 under `/first-light/`, with no remote requests. Actual GPU draws settle at 22→22 initially and 25→25 after resizing/content growth; comparing the same panel with/without the layer confirms a visible GPU contribution without changing HTML layout. The canvas fits at 1440px, 390px and 320px, grows with content, and is removed/recreated by the public hook while the input node, draft and programmatically retained focus survive. Native context loss, explicit remount recovery, an HDR 404 and unavailable WebGL retain usable HTML and the CSS glass surface. Healthy-page browser errors are empty. The deliberate HDR-404 fixture still reports Drei's expected loader error through the browser; it does not remove the native content or controls.

Separate, labelled CSS-only diagnostics place a checker/colour backdrop behind the panel with the GPU disabled. They confirm native DOM backdrop blur and colour transmission independently from the Three.js material. This is diagnostic evidence rather than a screenshot of the application, and does not claim that WebGL can refract native HTML.

See the current [desktop panel](previews/smoky-glass-desktop.png) and [mobile example](previews/smoky-glass-mobile.png). These are an isolated component preview, not a screenshot of a changed application page. The [initial browser report](glass-panel-3d-browser-verification.json) remains available as the baseline. Safari, mobile hardware and GPU performance have not been measured. No deployment or commit was made.
