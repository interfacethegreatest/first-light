# Traditional header framing

The user's latest instruction supersedes the oval-frame requests: restore traditional rectangular header/title framing with the app's standard corner radius. Keep the isolated title component and React template, one-line Moon/wordmark order and the corrected mobile Export row.

The coordinator owns the change to `HeaderFrame.module.css`: replace the 999px capsule radius with `var(--workspace-panel-radius, 7px)`. Both native header and title div already share that frame, so one rule restores both borders. Keep existing 1px theme border, glass and shadow styling; do not alter Moon rendering, controls, dependencies or unrelated sections.

Independent verification owns only a temporary browser helper and evidence outside the repository. After the production build is ready, confirm both frames compute 7px at 1440/320px, title and Export retain their row without overflow, and take a current screenshot. TypeScript/build and real browser checks are appropriate for this one-line CSS reversal; no new unit tests are needed. Return title code, styling change and verification. Do not deploy without new approval.

TypeScript and the Pages production build pass (`index-c8fq81Hq.js`). The [browser report](traditional-header-browser-verification.json) passes at 1440/320px: both native header/div frames use the same 7px radius and 1px border; title remains LTR/row/nowrap, Export stays beside it, one Moon is loaded, and there is no overflow, clipping or page error. See the [current mobile screenshot](previews/traditional-header-mobile.png). These are Chromium/software-WebGL functional checks. No unchanged runtime/action suites were repeated and no deployment occurred.

Code: [title component](../src/components/header/HeaderTitle.tsx), [title template](../src/components/header/headerTitleTemplate.tsx), [title layout CSS](../src/components/header/HeaderTitle.module.css), and [shared traditional frame CSS](../src/components/header/HeaderFrame.module.css). The Moon is by MaggaModels, [source](https://sketchfab.com/3d-models/moon-1425bed819624f0f92d1a05a4509289f), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapted for First Light.
