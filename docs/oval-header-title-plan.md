# Isolated oval header title

The later [traditional framing instruction](traditional-header-plan.md) supersedes the oval radius in this historical plan. Component isolation and single-line title layout remain current.

## Requirements and interpretation

The user confirmed the oval surrounds the **Moon and title together**. The title object must be an explicit `div` whose children occupy one non-wrapping line. Research workspace/Local context sits beneath that object rather than beside the Moon. Preserve native home navigation, keyboard/focus behavior and the separate Export control. This is a local implementation; deployment requires new approval.

Follow-up requirement: explicitly enforce left-to-right placement (Moon first, wordmark second) even when an ancestor uses right-to-left direction. The existing row/nowrap rules stay explicit, with `direction: ltr`, `writing-mode: horizontal-tb` and `justify-content: flex-start` scoped to the title div. Acceptance includes normal desktop/mobile layout and an inherited-RTL check; component/template/navigation ownership stays unchanged.

## Architecture and ownership

- Component agent: only new `HeaderTitle.tsx`, `HeaderTitle.module.css` and `headerTitleTemplate.tsx` in `src/components/header/`. Own the single-row Moon/title div, fitted oval frame and independent React template object. Reuse the existing Moon template unchanged.
- Coordinator: parent `MoonBanner.tsx`/CSS integration, existing header test, documentation and final review/checks.
- Verification agent: browser helper and screenshots/reports outside the repository only. Prepare independently; run against the production preview after integration/checks complete.
- Other workspace/source sections, Moon model/Canvas/resolution code and dependencies remain unchanged.

## Acceptance criteria

- Exactly one `div[data-header-title]` contains the existing Moon scene and first light wordmark. CSS explicitly uses `flex-direction: row`, `flex-wrap: nowrap` and `white-space: nowrap`.
- Its oval has intrinsic content width, modest padding, a capsule radius, the shared `--workspace-panel-border` (1px), matching glass and a restrained raised rim/shadow. It must not stretch to the full header width.
- The context is below the oval; the Moon and wordmark remain on the same line at 1440/390/320px without overflow, shrinking the Moon, clipping glow or separating the dot.
- Existing home `#top` link, focus/order, separate export and one actual Moon canvas remain usable.
- Relevant header/Moon-wrapper tests, TypeScript, repository-path production build and actual browser layout/control checks pass. Return full component/template/style code and screenshot evidence with any limits. Do not deploy.

## Code and local checks

- [HeaderTitle component](../src/components/header/HeaderTitle.tsx) and [oval CSS](../src/components/header/HeaderTitle.module.css).
- [React template object](../src/components/header/headerTitleTemplate.tsx).
- [Banner integration](../src/components/header/MoonBanner.tsx): the native home anchor renders `headerTitleTemplate.render()` followed by the context div. Its column layout prevents the context from appearing beside the oval.

```sh
npm test -- tests/moon-banner.test.tsx tests/moon-mark.test.tsx
VITE_BASE_PATH=/first-light/ npm run build
VITE_BASE_PATH=/first-light/ npm run preview -- --port 4198 --strictPort
```

The 10 relevant tests, TypeScript and production build pass. No new dependency, Moon runtime/asset or workspace section changes are involved. The existing large-bundle warning remains.

## Explicit direction follow-up

The additional `direction: ltr`, `writing-mode: horizontal-tb` and `justify-content: flex-start` rules pass TypeScript and the Pages production build (`index-i5Ay27Bd.js`). The [follow-up browser report](header-title-ltr-verification.json) passes at 1440/320px both normally and with `dir=rtl` on the parent link. In all four cases, the title retains two children in a left-to-right, non-wrapping row, the oval keeps its intrinsic width, and there is no overflow or page error. The home name and `#top` destination are unchanged. No new unit tests or unrelated suites were needed for this CSS-only follow-up.

## Original oval browser result

The actual production preview (`index-CZKJRYOt.js`) passes at 1440/390/320px. The explicit div's computed layout is row/nowrap with nowrap text; its two children (Moon and wordmark) stay on one line, including the dot. Its intrinsic oval measures about 315×138px desktop and 212×94px mobile, with the same 1px border tint as the wider banner, 999px capsule radius and matching glass/shadow. Metadata stays below the oval, and no clipping ancestors or horizontal overflow were found.

One actual textured Moon draws the original 205,824 indices without GL errors. The native `#top` home link, visible 3px keyboard focus, next Tab to Export, actual JSON download and retained Moon Canvas identity pass. There were no page errors. These are Chromium/software-WebGL functional checks, not hardware or physical-device performance measurements.

See the [full browser report](oval-header-title-browser-verification.json), [desktop header](previews/oval-header-desktop.png) and [mobile header](previews/oval-header-mobile.png). The Moon is by MaggaModels, [source](https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapted for First Light. This update remains local and has not been deployed.
