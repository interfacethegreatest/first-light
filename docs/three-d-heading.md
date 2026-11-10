# Reusable 3D heading

`ThreeDHeading` reuses the existing lazy FooterTextScene/Canvas renderer. It provides one native heading for accessibility and a static visual title above arbitrary HTML children. Its first integration is the Html glass card mounted on the main page through `App.tsx`; it can also be used independently in other components.

```tsx
import ThreeDHeading from '../components/typography/ThreeDHeading'

<ThreeDHeading title="A little more depth." id="panel-title" level="h2">
  <p>Keep descriptive content in native HTML.</p>
  <label>Draft<input name="draft" /></label>
</ThreeDHeading>
```

Props are `title?: string` (default `Default Title`), `children?: ReactNode`, `id?: string` and `level?: 'h1' | 'h2' | 'h3'` (default `h2`). The id belongs to the native heading, so an enclosing region can reference it with aria-labelledby. That heading is visually clipped; an aria-hidden sibling contains the visible canvas or readable HTML loading/failure fallback. The title therefore has one accessible heading name. Children stay outside the decorative subtree, fully opaque and usable. No div, paragraph or canvas is placed inside a native heading.

The title scene reserves 90px desktop/72px at <=720px with zero margins; it has no background and follows the available width up to 660px. Heading motion is disabled. `FooterTextScene` additionally accepts optional `motion` (default true for existing callers) and `className`; its old default text, data attributes, Canvas props and 112px/90px footer sizing are retained. Activity, lazy-loading, actual-draw readiness, fallback, context-loss cleanup and stale-callback guards are unchanged.

## Bold geometry and fitting

Both titles and the existing footer now use real Helvetiker Bold outlines. Text3D keeps size 0.8, with extrusion height 0.28, bevel thickness 0.025, bevel size 0.018 and 3 bevel segments. Fixed rotation [-0.14,-0.22,0] exposes the deeper peach sides against the existing white front. Material colours, local lights, bounded DPR and transparent canvas remain unchanged. The HTML fallback uses weight 700.

Manual orthographic fitting measures centered geometry and updates zoom only on text or CSS-size changes, with 1.15 margin. It has no Bounds controller, fitting animation or frame subscription. Heading mode requests demand frames only; FooterTextScene's existing visible/page-visible/non-reduced motion policy still controls its gentle Float, whose autoInvalidate remains false.

## Font provenance and licence

`public/fonts/helvetiker_bold.typeface.json` is copied byte-for-byte from the installed Three.js 0.167.1 `examples/fonts/helvetiker_bold.typeface.json`. It is 61,632 bytes, SHA256 `bd68159ee0b8d10fe24b9daa2e32f19686f9d8269a79dc8d44203a66298bfa2f`. It is self-hosted at `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`; no remote font or dependency change is introduced.

Metadata identifies Helvetiker Bold, normal style/bold weight, resolution 1000, PostScript name Helvetiker-Bold, Magenta Ltd copyright 2004, and Version 1.00 2004 initial release. Original glyph data and embedded licence metadata are unmodified. Required glyphs for `Default Title` and `Make learning tangible.` are present; custom titles must use glyphs available in this typeface.

The existing `public/fonts/LICENSE-helvetiker.txt` is the byte-identical companion MAGENTA/MgOpen licence from installed Three, covering this typeface. Its copyright/permission notice is retained, including permission to use/copy/distribute and the conditions on modified font naming and standalone font sales. The existing regular font and licence files are untouched. Companion licence SHA256: `35e8279356d7890871c4fce804d157e3f21456a7311ef2caab5cb4705c71b6bd`.

The full project check passes 167 application tests and 26 asset-packer tests, zero-error/zero-warning model validation, strict TypeScript and the production build. Real bold rendering on the main-page glass card and footer, responsive fit, native heading/child semantics, focused idle rendering and fallback preservation are verified in Chromium with software WebGL. See [main-page integration and browser evidence](main-glass-heading.md). Safari and hardware GPU performance remain unverified. No dependencies were added. Deployment was separately approved after implementation review.
