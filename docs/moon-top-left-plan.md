# Top-left Moon mark

## Requirements and selected control

Implement the latest pasted top-left brief using the verified Calendar4 Moon scene and model. The separately described adaptation-package files were not attached or present in the checkout. The implementation and packer are therefore local adaptations of the pasted requirements and the user-confirmed Calendar4 source, rather than copies of an unavailable package.

The actual active checkout is First Light: React 19, Fiber 9, Drei 10, Three 0.167 and Vite. Retain those compatible runtime versions. The target is `App.tsx`'s `header.site-header > a.brand`, with `href="#top"` and accessible name “First Light home”. Its original Sun SVG measured 38×38px at 1440px and 33×33px at 390/320px. Target MoonMark boxes are 42.75px and 37.125px, respectively. Existing header heights measured 91px and 81px. Keep the native link, keyboard navigation, focus outline, adjacent text and Sun displays elsewhere.

Use a stationary textured Moon by default. Apply 0.84 opacity and a static zero-offset 5px cool-white drop shadow at 0.24 alpha to the visual layer only. Use a transparent Canvas with local lights, orthographic framing and bounded DPR. Loading/error/unavailable-WebGL states use an aria-hidden local vector crescent; that fallback is not evidence that the model rendered.

## Architecture

`moonMarkTemplate.render()` supplies the reusable visual object to the existing home control. `MoonMark` owns the decorative DOM wrapper, lazy client-only Canvas, local error boundary, fallback and viewport/page/reduced-motion state. `MoonMarkCanvas` owns the camera, local lights and demand/always scheduling. `MoonModel` preserves Calendar4's `Moon_Moon_0` geometry, `Moon` material, X rotation −π/2 and composed 0.028×100 scale. It performs no additional normalization. Optional rotation uses elapsed delta; cached resources remain shared and are not disposed by a single instance.

Scene loading starts after the icon is visible. Once mounted, the Canvas stays mounted across visibility/preference changes. Its animation eligibility is `animate && inViewport && pageVisible && !reducedMotion`; stationary/offscreen/hidden states use demand rendering. Context loss and asset failures remain local. The preferred legacy MoonScene path and public Moon.jsx provide compatibility re-exports. Footer credit retains MaggaModels, the source, CC BY 4.0 and adaptation information.

`scripts/pack-moon-glb.mjs` embeds the original binary and JPEG without changing geometry, material, metadata, texture encoding or index types. Node fixtures exercise the local packer independently of real-model validation. The pinned Khronos validator checks both the originals and converted GLB, with decoded geometry and byte-identity checks. Keep originals and licence verbatim. Report actual bytes and hashes; packing is not claimed as compression.

## Acceptance criteria

1. Actual header placement renders the textured Moon, with the measured size increase, opacity and glow; original link action, accessible name, keyboard/focus behavior and surrounding layout remain usable at 1440/390/320px.
2. One icon Canvas loads the self-contained Pages-aware GLB through the same load/preload URL. No incorrect root Moon URL, external model texture/buffer, remote environment or decoder is required.
3. Geometry/material/orientation/names match the original. Preserve all original asset bytes and licence. Local converter tests, full validator output, exact GLB bytes/hash and an original-versus-GLB visual comparison are recorded.
4. Default/reduced-motion states are stationary without continuing self-scheduled frames. Optional rotation is frame-rate independent; offscreen/hidden tabs stop animation. Observers/listeners clean up and repeated instances share resources safely.
5. Missing assets, unavailable WebGL and context loss retain a usable home control and local fallback. Normal touch scrolling works. Actual rendering is verified beyond a readiness marker.
6. Regression tests, full project typecheck and production build pass. Record actual placement screenshots and distinguish controlled checks, completed native checks and environmental limitations. Deployment remains a separate approval.

## Ownership

- Coordinator: DOM mark/fallback/style/activity/template, App integration, package/lock/test-runner configuration, this plan, final review and PR work.
- Asset agent: original Moon files, GLB/pack report/licence/compatibility Moon.jsx, local packer/validator, Node fixture tests and asset provenance/validation reports.
- Runtime agent: MoonModel, MoonMarkCanvas and the preferred-path MoonScene re-export only.
- Verification agent: new React/scene unit tests and browser baseline/final/comparison probes and artifacts. Tests follow source integration; browser runs follow a final build.

No agent deploys or delegates. Independent asset/runtime tasks precede integration and final checks. Existing source-section/template/tile isolation remains intact.
