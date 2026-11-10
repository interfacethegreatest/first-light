# Original glass recipe restored

The later [PaneBackground extraction](pane-background.md) moves the shared paint into a reusable React object and its stylesheet while preserving this appearance. `src/styles/glass.css` now holds the shared values only.

The subsequent [glass inheritance update](glass-inheritance.md) retains these values and adds the newly supplied displacement lens where supported, with this original blur as the fallback.

The user's supplied glass appearance supersedes the unpublished lighter-tint/reflection experiment. Shared panes, source cards, text-entry fields and standalone header/card fallbacks now use:

```css
background-color: rgba(35, 37, 49, 0.5);
background-image: none;
backdrop-filter: blur(7px);
-webkit-backdrop-filter: blur(7px);
border: 1px solid rgba(240, 248, 255, 0.12);
border-radius: 6px;
box-shadow:
  inset 0 0 0 1000px rgba(35, 37, 49, 0.015),
  0 18px 45px rgba(0, 0, 0, 0.28);
color: rgba(240, 248, 255, 0.88);
font-family: inherit;
```

Blur is applied directly to each surface; the prior extra blur pseudo layers and added reflection/rim are removed. Field foreground overrides are removed, including the disabled source selector's old colour. Existing descendant typography and semantic status colours retain their hierarchy. The Sun badge stays circular.

This is a page-surface adaptation of the modal appearance. Existing page layout, selectable research text, native controls/focus, assets and Framer entrance/reveal timing remain intact. It does not impose the modal's `z-index: 99999`, disable page text selection or add a competing modal animation.

The coordinator owns the four CSS edits and browser check; independent agents review exact styling/fallbacks and run the existing component tests/typecheck/build without source edits. Publication follows the existing GitHub Pages workflow.

Verification passed: all 23 relevant component tests and the TypeScript/Pages production build (`index-C7usU8cb.js`, `index-BCNZN6FU.css`), plus whitespace checks. The existing large-bundle advisory remains. The independent review confirmed that the disabled-selector foreground override is removed from both source and generated CSS.

The [browser report](exact-glass-browser-verification.json) confirms all supplied visual values on 16 surfaces at both 1440px and 320px, with no gradient or horizontal overflow. Mouse/keyboard source creation, the 2px field focus indicator, drafts and existing workspace data pass with no page errors. See the [actual source pane](previews/exact-glass-source.png). The preview uses isolated synthetic workspace data and the actual application/scenes. Chromium verifies the standard blur property; the WebKit prefix is retained in the source, but Safari runtime was not tested.
