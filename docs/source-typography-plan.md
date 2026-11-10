# Source section typography

## Requirements and architecture

Align source-section titles and lorem/ipsum flavour text with SparkArt and the wider app, make the prose smaller, and left-align both. The wider application's current source files and SparkArt must remain unchanged by this task, including the earlier pending grid work. Return a code comparison between source title/body, SparkArt caption and the app's existing typography.

- The title inherits the app font, uses its heading scale (14px desktop / 15px at <=720px, weight600), and adopts the SparkArt caption's muted theme colour and 1.55px tracking. Remove the Poppins override/import, underline and centred alignment. Preserve title text/case and heading semantics.
- Paragraphs inherit font family/weight, retain explicit left alignment, and receive size/line-height/colour from the existing global `.source-content > p` rules: 10px desktop / 11px mobile, line-height1.75, colour#c0c5d3. Remove the card's13.6px/500/1.85/colour overrides rather than editing App.css.
- Align title and prose on the existing12px left inset. Preserve controls, reveal/tilt/reduced-motion behavior, source template/output, grid design and Sun scene.

## Ownership and sequence

- Component agent owns only NewUserCard.tsx and newUser.module.css for the scoped typography change.
- Coordinator owns docs, protected-file hashes, code comparison, review and final build/checks.
- Verification agent owns a temporary browser helper/evidence only. Capture the current production-build baseline before rebuilding; after source edits and build are ready, compare unchanged app/SparkArt computed styles and source typography/alignment at1440/390/320px.

Acceptance: title/body are left-aligned with matching inset, title inherits the root/SparkArt font and has no underline/Poppins, prose is smaller and follows current app source styles, controls/drafts/storage/reveal remain usable, no overflow, and protected wider-app/SparkArt/dependency file hashes stay equal. Relevant card/source tests, TypeScript, production build and before/after browser comparison pass. Do not deploy without new approval.

The [code comparison](source-typography-comparison.md) links the source title/body with SparkArt and the app styles. [Protected-file evidence](source-typography-protected-files.json) records before/after SHA-256 equality for the wider-app/reference files. The 22 card/source/reveal tests, TypeScript and Pages production build pass (`index-CzKcGY4y.js`). No deployment has occurred.

## Reviewed before/after browser result

The [browser summary](source-typography-browser-verification.json) passes at 1440/390/320px. All 16 protected root/SparkArt/hero/workflow/panel/form/header typography sets equal the old production baseline exactly. Source title now has inherited Inter/Segoe/Arial family, 14/15px size, weight600, 1.55px tracking, muted colour, left alignment and no underline. Prose uses the unchanged app rules at 10/11px, weight400, 17.5/19.25px line-height and #c0c5d3. Both text edges measure exactly 12px inside the card.

Normal reveal and reduced-motion creation remain visible and non-inert; drafts/storage, credit focus and source identity are preserved. The tile pattern remains 374×160px, with no overflow or page error. Checks isolated unchanged StarBackground and source Sun Canvas rendering, so they make no GPU/asset/performance claim. Actual source crops: [before](previews/source-typography-before.png), [after](previews/source-typography-after.png), and [mobile](previews/source-typography-mobile.png). Raw baseline/after JSON remain in `/workspace/artifacts/first-light-source-typography/`.
