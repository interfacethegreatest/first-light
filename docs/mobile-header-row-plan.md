# Mobile banner row

The later [traditional framing instruction](traditional-header-plan.md) supersedes the 999px oval border requirement below. Mobile row/control behavior is retained; historical oval verification remains recorded here.

## Requirements and acceptance

Keep the fitted Moon/title oval and Export beside one another on the parent banner's mobile row, without horizontal overflow at 320/390/560px. Preserve the existing Moon/title size, oval styling, native home link, keyboard focus, export action/name, and separate non-nested controls. Keep desktop's full text Export button. On mobile use a 44px download-icon button so both controls fit without shrinking the existing title or Moon. Do not deploy without new approval.

The user additionally requested an isolated React border object and oval border radius for the banner. Extract the shared border/glass into `HeaderFrame` plus `headerFrameTemplate`; both the outer semantic header and inner title div use the same 999px capsule radius and 1px theme border. Keep their DOM controls and row layout intact, with enough space inside the curved frame for text, icon and focus.

## Architecture and ownership

- Component agent: new `HeaderExport.tsx` and CSS module only. Own the existing CalendarButton export control, reusable download SVG, desktop text/mobile icon presentation, accessible label, tooltip and 44px target. No shared CalendarButton edits.
- After that ownership returns, the component agent independently owns only new `HeaderFrame.tsx`, its CSS module and `headerFrameTemplate.tsx`; the coordinator integrates the shared frame into the title and banner sequentially.
- Coordinator: integrate HeaderExport in MoonBanner, make the parent mobile layout explicitly row/nowrap, adjust its mobile padding/gap, remove obsolete parent export styles, run checks and review.
- Verification agent: browser helper and evidence outside the repository only; prepare independently and run after production build/preview is ready.
- Existing HeaderTitle/template/Moon rendering and other workspace sections retain their code and behavior.

Acceptance includes a real rendered Moon, the export button positioned beside the title oval, no overflow/wrap/clipped focus, normal desktop text, mobile icon visibility and accessible name, native home keyboard navigation and actual export download. Verify at 1440/560/390/320px. No new tests that duplicate CSS declarations are required; use existing header interaction tests and actual browser geometry.

## Code and checks

- [Parent banner layout](../src/components/header/MoonBanner.module.css): explicit row/nowrap on the banner, 12px mobile padding, 8px gap and remaining row width assigned to the home section.
- [Banner integration](../src/components/header/MoonBanner.tsx) now renders the independent [HeaderExport](../src/components/header/HeaderExport.tsx) with its [responsive CSS](../src/components/header/HeaderExport.module.css).
- [HeaderFrame](../src/components/header/HeaderFrame.tsx), [shared oval CSS](../src/components/header/HeaderFrame.module.css) and [frame template](../src/components/header/headerFrameTemplate.tsx) now own both banner/title borders. The banner template selects native `header`; [HeaderTitle](../src/components/header/HeaderTitle.tsx) selects native `div`. This removes duplicate frame styling without adding DOM wrappers.
- The mobile icon is outside the animated label container, is aria-hidden and ignores pointer events. This keeps the label's reduced-motion rules from hiding the permanent mobile icon, while native button events and its accessible name remain intact.

The 10 existing header/Moon-wrapper interaction tests, TypeScript and Pages production build pass for the combined change, including native shared-frame semantics/markers. No new runtime dependencies or shared CalendarButton edits are involved. The existing bundle-size warning remains.

## Reviewed browser result

The final Pages-path production preview (`index-wUKOAW5F.js`) passes at 1440/560/390/320px. There are exactly two native frame elements: outer `header` and inner title `div`, sharing the same 1px tinted border, 999px capsule radius, glass and visible overflow. Sampling the inner curved border plus visible Export/icon/metadata confirms they remain inside the outer capsule; no extra padding adjustment is needed.

Export stays beside the title without overlap or horizontal overflow. Mobile target/wrapper is 44×44px with a visible, pointer-inert 16px icon. Desktop retains its full text. Home Enter/navigation, native Tab/focus and one actual JSON download per action pass in both normal and reduced motion (two downloads total); no page errors occur. The loaded Moon retains its canvas and existing size. Focus indicators stay visible; the home outline can extend outside the frame deliberately.

See [combined browser evidence](mobile-header-row-browser-verification.json), [desktop](previews/oval-banner-row-desktop.png), and [mobile](previews/oval-banner-row-mobile.png). These are Chromium/software-WebGL functional checks; physical-device/GPU performance was not measured. The Moon is by MaggaModels, [source](https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapted for First Light. No deployment was performed.
