# Matching spark and source tile design

## Requirements

Isolate the artwork containing “EVERY BUILD STARTS WITH A SPARK” and copy its grid thickness/design into the source-section tile decoration. In this checkout the reference is App.css's `art-grid` background: two 1px cool-white gradients, 28px cells, 22px cells below 720px and a radial fade. It is not currently an import of CardTiles.

Use one shared decorative TileGrid component/CSS so both sections inherit the same visual definition. Preserve the hero's Sun SVG/caption and existing responsive appearance. Source CardTiles retains its fixed 374×160px canvas, twelve tiles, six loader accents and existing hover/focus/reduced-motion behavior; update all accent thicknesses and colours to the reference's 1px palette. Natural card height, output, controls, Sun scene and parent animations remain unchanged. Do not deploy without new approval.

## Architecture and ownership

- Coordinator first creates `components/decorations/TileGrid.tsx` and its CSS module with the shared visual contract. Coordinator also owns App.tsx/App.css integration, docs and final review/checks.
- Hero agent owns only new `components/hero/SparkArt.tsx` and its CSS module, reusing TileGrid. No App edits.
- Source agent owns only existing `cards/newUserCard/CardTiles.tsx` and `cardTiles.module.css`, reusing TileGrid and inherited tokens. No parent/component-template edits.
- Browser verifier owns its temporary script and screenshot/report directory only; prepares independently and runs after integration/build is ready.

## Acceptance

- Hero and source decorations both render TileGrid with identical computed gradient, mask, line width/colour and pixel cell size at desktop and a width where both are visible below 720px.
- The caption/Sun and responsive hero placement retain their previous appearance. The hero still hides below 420px and caption below 720px.
- Source canvas stays 374×160px on short/tall/growing/narrow cards; tile dimensions and loader endpoints remain fixed. All visible grid, border and loader strokes use the same 1px reference colour.
- Native source controls and drafts remain usable; decorations are aria-hidden and pointer-inert. Hover/focus and reduced-motion behavior work without layout shifts or overflow.
- Relevant source/card tests, TypeScript, production build and actual browser comparison pass. Return both tile components and their matching CSS, plus a source-section code link and screenshot evidence.

## Code and checks

- [SparkArt](../src/components/hero/SparkArt.tsx) / [layout CSS](../src/components/hero/SparkArt.module.css) isolate the original reference's grid, exact Sun SVG and flavour text.
- [CardTiles](../src/components/cards/newUserCard/CardTiles.tsx) / [accent and fixed-layout CSS](../src/components/cards/newUserCard/cardTiles.module.css) adapt the source decoration.
- Both use [TileGrid](../src/components/decorations/TileGrid.tsx) and [the same paint CSS](../src/components/decorations/TileGrid.module.css). Source accents inherit that component's line width/colour. Horizontal loaders use a single bottom edge so their actual painted height stays 1px; vertical accents use a single right edge.
- [SourceSection](../src/components/sources/SourceSection.tsx) renders [NewUserCard](../src/components/cards/newUserCard/NewUserCard.tsx), which mounts the updated CardTiles. Section content, Sun scene and control code stay separate.

Passed: 15 card/source tests, 7 source reveal-sequence tests, TypeScript and the Pages-path production build (`index-B7-MQfUd.js`). No new CSS-mirroring unit tests or dependency changes were needed. The existing large-bundle warning remains.

## Reviewed browser result

The [compact browser evidence](matching-spark-tiles-browser-verification.json) records exact hero/source paint equality at 1440px (28px cells) and 700px (22px cells), including gradients, fade masks, colour and 1px line width. The caption/Sun and original hide/resize breakpoints are preserved.

Three source cards measured 260/435/888px high; added output grew the first to 1268px. Every pattern remained 374×160px with unchanged tracks and tile positions through growth and 390/320px clipping, without page overflow. Horizontal loaders finish at 93/186/62px wide and exactly 1px high, using one bottom edge and no top edge; vertical accents remain 1px wide with 16/160/160px travel. Hover and focus agree, and reduced motion disables animations/transitions.

Pointer/aria isolation, native mouse/Enter/Space additions and credit focus, draft/storage preservation and section identity pass; there are no page errors. The browser run suppressed the unchanged StarBackground import and hid source Sun Canvas roots to isolate decoration geometry. Loader animations were paused only at their real CSS keyframe endpoints for measurement; no asset/GPU or animation-performance claim is made.

Actual browser crops: [reference](previews/matching-tiles-reference-1440.png), [source at rest](previews/matching-tiles-source-rest-1440.png), and [source hover](previews/matching-tiles-source-hover-1440.png). No images were composited or fabricated. Raw evidence remains in `/workspace/artifacts/first-light-matching-spark-tiles/report.json` with its SHA-256 recorded in the compact report. This change is local and has not been deployed.
