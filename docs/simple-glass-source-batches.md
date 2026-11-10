# Simple glass panel and three source sections per activation

This records the original glass/source-batch integration checks. See the [combined release notes](transmission-scenes.md) for the latest aggregate verification and publication scope.

## Requirements and scope

Restore the main-page glass panel to the supplied screenshot: a subtle rectangular glass surface, a regular HTML heading, a description and one native draft field. Remove the main page's large 3D-title/torus presentation. Preserve the reusable Html scene, bold 3D typography, mount hook, Moon, workspace, source/decision records, storage and export.

Each Add source activation must append all three existing boilerplate variants together, with short, medium and long plain-text paragraphs. Existing cards keep their IDs, DOM nodes and text. Keep parent expansion before staggered reveals and retain the reduced-motion policy. UI boilerplates remain temporary and independent of saved research records.

Supply a complete, unabridged source snapshot and component inventory. No dependency changes, commits, pushes or deployment are part of this change.

## Architecture and ownership

- `App.tsx` mounts `ResearchDraftPanel` at the existing `#glass-workspace` location. The anchor's startup scroll behavior remains unchanged.
- `ResearchDraftPanel.tsx` owns only its temporary text. It composes the existing `GlassPanel3D`, giving the native HTML field a static, removable decorative glass layer. Its CSS is local to the component. The pictured heading text is retained as ordinary HTML. A one-row textarea matches the initial input appearance while preserving multiline editing and native resize.
- `sourceSectionTemplate.createBatch()` creates the three variants independently of any earlier single-template calls. `useSourceSections` appends the batch with one state update, creating UUIDs outside React's replayable updater.
- `SourceSections`, `SourceSection`, `NewUserCard` and their shared styling/reveal sequence stay unchanged.
- The interface agent owns only the source hook/template and source behavior tests. The coordinator owns the main-page panel, height-integration expectation and current documentation. The verification agent owns main-page tests and browser evidence. The documentation agent owns the source exporter/catalog/archive; the final snapshot is generated after application edits finish.

## Acceptance checks

1. The actual main page contains the pictured simple panel with one visible native heading and editable draft field, without a nested title canvas or torus scene in this panel.
2. The temporary draft remains usable if its decorative renderer is missing or fails, and never appears in workspace storage/export. The existing saved workspace and metadata drafts survive unrelated interactions.
3. One mouse click produces exactly three source sections; subsequent mouse/Enter/Space activations append another three each. Each batch contains the three paragraph lengths with unique stable IDs and sequential titles.
4. Parent height expands before child reveals, including batches and rapid additions. Reduced motion still settles immediately. Previously rendered card and Sun nodes remain stable.
5. Desktop and narrow mobile layouts fit; the cold `#glass-workspace` link still lands correctly. The separate Html scene and existing bold footer remain available.
6. Strict TypeScript, relevant behavior tests, model checks and the production build pass. All sourcebook files and ZIP entries match the final source byte-for-byte.

## Completed checks

`VITE_BASE_PATH=/first-light/ npm run check` passes: 169 application tests across 20 files, 26 GLB packer tests, original/converted Moon validation with zero errors or warnings, strict TypeScript and the multipage production build. The existing large-chunk build advisory remains; no lint script is configured. The packer's CLI subprocess required running the check outside the initial restricted sandbox; the complete rerun passed without source changes.

Source behavior tests cover ordered batches after mouse, Enter and Space; exactly three UUID allocations per activation under StrictMode; stable existing cards/paragraphs; and independent drafts, records and form actions. Height/reveal tests cover complete batches, retained first-batch/Sun nodes, rapid additions, focus and reduced-motion settlement. Main-page tests cover the original copy/plain heading, temporary draft isolation, renderer failure and multiline draft/focus retention while toggling only the decorative layer.

The [complete sourcebook](component-catalog.md) includes the component-bearing/compatibility modules, hooks and template objects. All files under `src/`, the public Moon compatibility component and the example entry file are included unabridged. The sourcebook is regenerated after subsequent source edits; see the [manifest](component-catalog-manifest.json) for current counts, per-file SHA-256 and artifact hashes. The [source ZIP](component-source.zip) contains exact source bytes. Independent ZIP/code-block extraction and byte checks and `node scripts/export-component-catalog.mjs --verify` pass.

The [production-preview browser report](simple-glass-source-batches-browser-verification.json) passes. The actual main page's physical glass layer loads at 1440px and 320px, the cold fragment link lands correctly and neither width overflows. Native WebGL context loss removes only the decorative canvas, retaining the same multiline draft node, value and keyboard focus, with no page errors. See the restored panel at [desktop](previews/simple-glass-panel-desktop.png) and [mobile](previews/simple-glass-panel-mobile.png).

The source-flow browser check uses the real normal-motion DOM with decorative GPU scenes isolated. One mouse click creates three cards with paragraph lengths 123, 495 and 1,487 characters; Enter adds another three. The original three card nodes, temporary draft, metadata fields and saved workspace remain unchanged, and downloaded JSON exactly matches the seeded saved workspace. The parent grows while pending children are hidden, and visible-child samples show natural `height: auto`. See [three cards at desktop](previews/three-source-cards-desktop.png) and [mobile](previews/three-source-cards-mobile.png); these two captures isolate the decorative scenes.

Limitations: browser checks use Chromium/SwiftShader. Sparse native animation-frame sampling missed the 300ms numeric-height phase, so intermediate smoothness is not established by the browser evidence. The 20 focused height/reveal tests verify the parent-settlement contract with controlled timing. Existing unchanged model/example/footer lifecycle evidence is reused; Safari and hardware GPU performance are untested. No application code was changed to compensate for software-rendering timing.

The user subsequently approved publishing this work with the Moon rotation and transmission studies through the existing manual GitHub Pages workflow.
