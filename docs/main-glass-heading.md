# Main-page glass and bold 3D headings

The glass scene is mounted directly in `src/App.tsx` at `#glass-workspace`, below the two workspace panels and above the existing next-step/footer area. It is no longer available only through the component example. This change adds one self-contained card and leaves the header, hero, workspace controls, records, storage format and existing scene behavior in place.

```tsx
<HtmlGlassCard
  title="A little more depth."
  eyebrow="A SMALL SPARK"
  noteLabel="Idea draft"
  hint="Temporary draft · Clears on reload"
>
  <p>Use this temporary space to sketch the next idea you want to explore.</p>
</HtmlGlassCard>
```

`HtmlGlassCard` adds optional `title`, `children`, `eyebrow`, `noteLabel` and `hint` props. Existing defaults, `error` and `inputHeight` remain compatible with the demo. Children are rendered as native HTML, without forcing a paragraph wrapper. The draft remains component-local rather than being added to saved research records. Parent height follows measured content, including the heading frame.

The original stable Drei Html portal, single native content host, Calendar4 input CSS states, exact `src/components/input/outsideClick.tsx` hook, height/ref logic and focus/draft-preserving fallback are retained. Only the actual outer scene canvas is translucent/decorative. The new title canvas sits in the Html DOM portal and keeps full visual opacity; its decorative layer does not hide native headings or child controls from accessibility.

## Reusable title boilerplate

```tsx
import ThreeDHeading from '../components/typography/ThreeDHeading'

<ThreeDHeading title="Your title" level="h2" id="your-title">
  <p>Your native HTML content.</p>
</ThreeDHeading>
```

This follows the requested `title`/`children` template. One native h1/h2/h3 supplies the accessible heading, and an aria-hidden visual layer supplies Text3D or its readable loading/failure fallback. Children remain interactive native elements. The default is a static h2; the first h1 remains the page hero.

The same renderer now gives the title and footer a real bold font, 0.28 extrusion, 0.025 bevel thickness, 0.018 bevel size, three bevel segments and a restrained tilt exposing peach side faces. The font is copied byte-identically from installed Three.js, with the existing MAGENTA/MgOpen licence retained. No dependencies or remote assets were added. Headings remain stationary and render on demand; footer/torus activity retains reduced-motion, visibility and focus policies.

Ownership was separate: a typography agent owned only the title/shared-renderer/font work; the coordinator owned main-page and Html integration; a verification agent owned new tests and browser evidence. Integration followed the typography handoff. The user subsequently approved publication through the existing manual Pages workflow.

`VITE_BASE_PATH=/first-light/ npm run check` passes all 167 application tests across 20 files, all 26 asset-packer tests, original/converted model validation with zero errors/warnings, strict TypeScript and the Pages-path multipage production build. Seven new cases cover the reusable heading/native children and actual App integration; existing Html tests now mock the additional decorative title GPU boundary. No assertions were weakened. Vite's existing large-chunk advisory remains; no lint script is configured.

The [main-route browser report](main-glass-heading-browser-verification.json) confirms real Html content and a loaded bold Text3D mesh on the main page, plus the shared bold footer. The local bold font returns 200 with the expected 61,632 bytes/hash. Desktop and 320px captures fit without horizontal overflow. Keyboard/outside-empty/filled behavior works. The title and glass settle to unchanged draw counts while focused; the independent footer may retain its own permitted animation. Native WebGL context loss preserves the same field/host, note and selection in the DOM fallback. Separate synthetic native-workspace checks verify source sections, saved decisions/status/export and reload behavior; the temporary idea draft clears on reload while saved research persists. Healthy-page JavaScript errors are empty.

See the actual [main-page desktop placement](previews/main-glass-heading-desktop.png) and [mobile card](previews/main-glass-heading-mobile.png). Screenshots come from the main route, not the separate demo, with reduced motion for clean still images. Verification uses Chromium/SwiftShader, not Safari or hardware performance measurements. The approved publication targets [First Light's glass section](https://interfacethegreatest.github.io/first-light/#glass-workspace); the [manual workflow](https://github.com/interfacethegreatest/first-light/actions/workflows/pages.yml) records the deployed revision and result.
