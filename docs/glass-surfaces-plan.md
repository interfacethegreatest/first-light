# Shared glass surfaces and source section shape

This records the TimeModal recipe published in PR 15. The later unpublished lighter-glass experiment was superseded by [the user's restored original glass recipe](exact-glass-pane.md).

## Requirements

Apply the user's TimeModal visual recipe to the neutral dark surfaces and source cards: rgba(42,44,58,.5), blur7px, 1px Alice-blue/.1 border and the exact inset/10px28px/.34/inset-white/.025 shadow. Use its subtle5px radius consistently on page panels and source sections. Preserve responsive sizing, relative page layout, overflow needed by controls/scene badges, typography, tile design, native actions and focus indicators. Fixed modal width/height/position/z-index are not page-panel layout rules. Do not deploy without new approval.

The final response also gives three prioritized overall-app styling recommendations and three source-section recommendations, distinguishing changes made here from future suggestions.

## Architecture and ownership

- Coordinator first creates `src/styles/glass.css` with shared tokens and selectors isolating neutral surfaces: research/decision panels, source card utility, stats, decision cards, next-step, form fields/status select. Coordinator then removes duplicate glass definitions from App.css and routes corresponding radii/borders to the shared rules.
- Component agent owns only newUser.module.css and HeaderFrame.module.css: synchronize standalone fallbacks with the recipe; remove extra card/header shadow overlays; adapt the source's opaque Sun-badge backing to shared glass while retaining its circular shape and scene implementation. Preserve typography, tile/reveal/tilt and control code.
- Browser verifier owns only temporary probe/evidence. Capture old production baseline before rebuilding, then compare container/source/field/header computed glass and shape at1440/390/320, with native actions/focus and source growth/reduced behavior. No unrelated asset/GPU/performance suites.

## Acceptance

- All named neutral surfaces, both header frames and source cards use the exact shared tint/shadow and1px/.1 border. Fields blur directly; containers use a separate pointer-inert blur layer so nested glass keeps working. Pseudo-layer radius follows its parent.
- Parent/source/stat/decision/next-step/field radii are5px, no capsules; source badge stays circular and adopts the new backing. Page background, semantic status/error/button colours and font hierarchy remain unchanged.
- Source normal/hover/focus shadows follow the recipe without stronger hidden overrides. Layout, natural height, grid374×160, source title/prose alignment/font values, scene mounting, focus indicators and actions remain intact.
- Relevant22source/card/reveal tests, TypeScript, production build and actual desktop/mobile browser checks pass. Return SourceSection and the real shared CSS plus six recommendations. Screenshots/reports distinguish normal UI from any isolated renderer fixture.

## Code and checks

The [shared stylesheet](../src/styles/glass.css) isolates neutral surface selectors/tokens and is imported first by [App.css](../src/App.css). [SourceSection](../src/components/sources/SourceSection.tsx) supplies `surfaceClassName="workspace-panel-surface"` to [NewUserCard](../src/components/cards/newUserCard/NewUserCard.tsx); its [CSS](../src/components/cards/newUserCard/newUser.module.css) retains standalone fallbacks and uses the same recipe. [HeaderFrame CSS](../src/components/header/HeaderFrame.module.css) and the circular Sun-badge backing consume the same tokens.

All 22 card/source/reveal tests, TypeScript and the Pages production build pass (`index-D8ms6c0i.js`). `git diff --check` passes; no lint script is configured. The glass update changes no runtime dependencies, models, scenes or typography. The existing bundle-size advisory remains. This version was subsequently published in PR 15.

The [browser verification report](glass-surfaces-browser-verification.json) passes at 1440, 390 and 320 pixels. All 15 neutral surfaces match the supplied tint, border, radius and three shadows. Eight containers retain a separate 7px blur layer; seven field/select surfaces blur directly. Source shadows match in normal, hover and focus states. Settled layout dimensions, typography, semantic colours, source identity and drafts are preserved. Source creation, reduced-motion content, keyboard focus, persisted status changes and JSON export pass with no page errors or horizontal overflow.

Compare the [source before](previews/glass-source-before.png), [source after](previews/glass-source-after.png) and [mobile panel](previews/glass-panel-mobile.png). These are application CSS/layout captures using isolated synthetic workspace data. The verifier suppressed the unchanged star import and hid source Sun canvases; the captures do not certify Three.js asset loading, GPU behaviour or performance. Responsive height comparisons wait for the existing expansion animation to restore natural height. Computed shadow comparisons use a browser-normalized reference of the exact supplied recipe.

## Styling priorities to consider next

Overall application:

1. Keep all neutral surfaces on the shared glass, border and radius tokens. This consistency is implemented by the current update.
2. Consolidate padding and gaps around an 8/12/16/24px spacing scale, with a consistent mobile gutter. This is a recommendation, not an additional layout change.
3. Strengthen the hierarchy between primary actions, secondary controls and supporting text. Verify contrast on the brightest background, keep visible keyboard focus and preserve adequate touch targets.

Source sections:

1. Raise supporting prose from the current 10px desktop/11px mobile toward 12–13px with a comfortable line height. It can remain smaller than the title without becoming difficult to read.
2. Use consistent 12–16px content insets and let text determine height; retain left alignment and the shared 5px corners. The current update retains existing padding and natural-height behaviour.
3. Keep the tile grid and hover glow quieter than the content. Consider reducing the remaining green hover halo and reserving stronger emphasis for actual focus or selection; this update preserves the existing decorations.
