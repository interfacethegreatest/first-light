# Main-page glass objects

This records the original deployed integration. See [the newer clarity update](transmission-reference-debug.md) for the current main-page optical preset, neutral capture backdrop and release verification scope.

## Requirements and architecture

Mount both reusable glass cards in the main First Light page, after the existing Research draft pane and before the next-step message. Preserve the research forms, source-section generation, draft, exports, header and existing example. Use two desktop columns and one mobile column without changing the surrounding layout.

The cards share these initial values: Y-axis spin enabled at 0.25 radians/second; transmission 1; thickness 0.41; IOR 1.7; chromatic aberration 0.062; roughness 0.08. Quality stays Automatic. A main-only lighting multiplier of 1.25 strengthens the existing procedural studio lights. A cool grey `#cdd2d9` tint gives the surface more body while keeping optical transmission. The canvas is not faded to simulate glass, and no photographic environment is introduced.

The existing 3D footer message gains Y-axis rotation at 0.12 radians/second. Other typography consumers retain zero rotation by default. Geometry, fonts, fixed footer height, accessible text and fallbacks remain intact.

## Main App additions

Import the existing native cards in `src/App.tsx`:

```tsx
import { GlassTorusCard, GlassPanelCard } from './components/glass-objects/GlassObjectCards'
```

Their shared initial props are:

```tsx
const MAIN_GLASS_PROPS = {
  initialSpin: true,
  initialRotationAxis: 'y' as const,
  initialRotationSpeed: 0.25,
  lightingIntensity: 1.25,
  initialMaterial: {
    transmission: 1,
    thickness: 0.41,
    ior: 1.7,
    chromaticAberration: 0.062,
    roughness: 0.08,
    color: '#cdd2d9',
  },
}
```

Add the two-card section immediately after the existing `glass-workspace` section:

```tsx
<section id="glass-objects" aria-label="Glass objects" className="main-glass-objects">
  <GlassTorusCard {...MAIN_GLASS_PROPS} />
  <GlassPanelCard {...MAIN_GLASS_PROPS} />
</section>
```

The existing footer scene call becomes:

```tsx
<FooterTextScene rotationSpeed={0.12} />
```

The App's existing post-mount anchor handling also accepts `#glass-objects`, while retaining `#glass-workspace`.

## Scoped layout

Only the new section's layout is added to `src/App.css`:

```css
.main-glass-objects {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  margin-top: 32px;
  min-width: 0;
  scroll-margin-top: 24px;
  align-items: start;
}
@media (min-width: 1000px) {
  .main-glass-objects {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

Each card owns its controls, settings, activity observers and Canvas. Editing one card does not change the other. Native titles and controls stay outside their scenes; each scene contains one actual mesh. Transmission can sample the Three.js scene, but does not refract HTML or another canvas. Lighting uses the existing four offscreen Lightformers and local lights, with unchanged exposure and single-shot environment capture. The lighting multiplier defaults to 1 for existing consumers.

## Ownership and acceptance

- Coordinator owns App integration, scoped CSS, card lighting support, documentation, catalog, integration checks and release.
- Interface agent owns only FooterTextScene/FooterTextCanvas and their focused tests; rotation is independent of the App integration.
- Verification agent owns only main integration/card tests and temporary browser artifacts. Real browser checks follow production readiness.

Acceptance: both cards appear in the real main page with the exact initial optical values, tint, axis and speed; main-only lights are stronger; rotation uses elapsed time and pauses offscreen/hidden/reduced or during card editing; footer rotation is centered and fits desktop/mobile bounds; native controls, source batches, draft and export remain usable. Run strict types, relevant tests, asset validation and the production build. Inspect actual GPU rendering, optical/light uniforms and screenshots, then verify the deployed files and public page. Deployment is explicitly authorized by the user.

## Verification

Strict TypeScript, all 214 application tests across 24 files, 26 GLB packer tests, Moon validation with zero errors/warnings and the production multipage build pass. The exact component catalog/manifest/ZIP verifies against all 98 selected source files. No dependencies, source assets or workspace schema changed. The existing Vite large-chunk advisory remains; no lint script is configured.

The coordinator reviewed both implementation and independent read-only handoffs, then inspected the actual rendered [desktop](previews/main-glass-objects-desktop.png), [mobile](previews/main-glass-objects-mobile.png), [320px mobile](previews/main-glass-objects-mobile-320.png), [paused footer](previews/main-footer-static.png) and [rotating footer](previews/main-footer-y-rotation.png) captures.

- [Normal main-page proof](main-glass-browser-verification.json): both real canvases, one mesh each, exact five optical uniforms and linear RGB tint, correct placement/columns/stacking, working cold `#glass-objects` anchor and zero page/console/HTTP errors. This capture uses the normal main page with no suppressed GPU layers or network overrides; Balanced is selected for the software-rendered optical comparison, while the application defaults to Automatic.
- [Motion, lighting and native controls](main-glass-motion-verification.json): actual main light coefficients are exactly 1.25 times the example's coefficients. Transmission 1/0 produces a visible same-view optical change. Both objects rotate around Y at the configured speed, focused/reduced scenes settle in demand mode, and three-source generation, drafts, saved storage and native JSON export remain independent of the glass controls. A no-WebGL check retains the native interface. Only unchanged star/Sun/research-panel GPU regions are suppressed in this bounded fixture; the new glass and footer scenes remain real.
- [True coarse-touch 320px proof](main-glass-mobile-verification.json): both canvases load, cards stack without horizontal overflow and retain vertical `pan-y` scrolling with zero healthy errors.

The footer accumulates approximately 0.9092 radians of observed yaw over 7.6815 seconds (0.11836 rad/s), consistent with its configured 0.12 rad/s plus the existing small Float motion. Its reduced-motion draw counts settle. A full 52-second revolution was not observed in the browser; camera fitting uses the independently reviewed full-turn geometric envelope. Full Y rotation naturally presents edge-on and reversed lettering during a turn; the ordinary footer text and accessible label remain available.

The initial GPU tint probe incorrectly sampled a virtual light's diffuse uniform. The corrected probe records the active host material program and confirms the actual `#cdd2d9` tint. A tall mobile locator screenshot also exposed an offscreen fixed skip link as a capture artifact; its focus/transform were checked and the final presentation uses a taller viewport without changing accessibility CSS.

Browser verification uses Chromium/SwiftShader and emulated touch. It does not establish Safari, device GPU performance or an FPS target. Deployment was explicitly approved and uses the existing [Pages workflow](https://github.com/interfacethegreatest/first-light/actions/workflows/pages.yml).
