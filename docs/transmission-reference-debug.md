# Clearer main-page transmission glass

This records the earlier clarity release. The [transparent canvas and typography update](transparent-glass.md) subsequently moves the studio backdrop into capture-only rendering and publishes the standalone text example.

## Requirements and acceptance

Apply the user's selected reference to the **main-page torus and blank 3D panel**, keeping First Light's current colours. Preserve the shapes, single visible mesh per canvas, rotation, native controls, activity policy and wider application. No new dependencies are included. The user explicitly authorized deployment on 11 November 2026.

Acceptance: render a real neutral backdrop into the transmission capture; retain `#cdd2d9`, transmission/opacity `1`, existing geometry and quality budgets; demonstrate clearer optics in the actual main page; preserve native field focus and edited settings; pass available TypeScript, application tests and production build checks. Screenshots from software Chromium demonstrate appearance, not physical Safari/GPU performance or an exact recreation of the reference composition.

The coordinator owns scene integration, documentation/source snapshots and final review. Independent source research is read-only. The verification agent owns the two glass-card test files and temporary browser artifacts. Integration follows source review; browser verification follows the production build. No overlapping source edits are assigned.

## Why the previous glass looked different

The torus and panel already use Drei's `MeshTransmissionMaterial` through `TransmissionSurface`. The previous main preset used thickness `0.41`, IOR `1.7`, roughness `0.08`, chromatic aberration `0.062`, and shared distortion/anisotropic blur defaults of `0.2`.

Each isolated canvas held one visible mesh against `#080b14`. During its transmission capture, the material discards its host mesh, leaving mostly a uniform dark backdrop to transmit. The procedural studio environment uses `background={false}`: it supplies surface reflections while the transmitted backdrop stays dark. Increasing lights adds highlights, but does not replace bright scene content.

Native page HTML, Drei `Html` DOM portals and separate canvases are not automatically included in that WebGL capture. Lowering CSS/material opacity blends surfaces rather than reproducing refractive volume. Keep opacity `1` with nonzero transmission.

Desktop High still uses six samples, 512px buffers and a backside pass. Coarse-pointer Automatic still selects Balanced: four samples, 256px and no backside. Compare a fixed quality when judging optics; these modes differ in volume treatment too. The panel also remains a shallow rounded plate, rather than the reference's thick block, so its magnification and silhouette are intentionally different.

## Focused implementation

- [App.tsx](../src/App.tsx) selects `backdrop="neutral"` for the existing two main cards. Its shared preset keeps colour `#cdd2d9`, transmission `1`, thickness `0.41`, Y rotation `0.25` radians/second and lighting multiplier `1.25`. IOR becomes `1.45`, roughness `0.03`, chromatic aberration `0.02`, anisotropic blur `0.04` and distortion `0.04` to reduce haze and exaggerated warping.
- [GlassCaptureBackdrop.tsx](../src/components/glass-objects/GlassCaptureBackdrop.tsx) owns a 512×512 procedural, cool-neutral `CanvasTexture` attached as the scene background. The same gradient is visible behind the object and captured by its transmission material. It contains no photograph, lettering or extra mesh. It uses sRGB colour data, linear filtering and no mipmaps, and disposes its texture on unmount.
- [GlassObjectCanvas.tsx](../src/components/glass-objects/GlassObjectCanvas.tsx), [GlassObjectCards.tsx](../src/components/glass-objects/GlassObjectCards.tsx) and [glassObjectSceneTypes.ts](../src/components/glass-objects/glassObjectSceneTypes.ts) forward the optional backdrop choice. Existing other usages default to the original dark backdrop. Changing it preserves the mounted renderer and edited controls.

The new backdrop uses a direct 2D texture. A temporary comparison using a blurred procedural cube environment as the visible background rendered black in this installed browser/runtime combination; the direct texture avoids that observed path. The shared reflection environment stays unchanged. This does not establish a general Drei defect.

The installed Drei 10.7.9 ESM/CJS material files match the integrity-verified official npm package. No vendor patch, library upgrade, remote preset or new asset dependency is needed.

## Reference evidence and limits

The [official documentation](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material) and [MDX source](https://github.com/pmndrs/drei/blob/master/docs/shaders/mesh-transmission-material.mdx) link CodeSandbox `hmgdjq`. The [source author explains the blurred visible environment](https://discourse.threejs.org/t/meshtransmissionmaterial-more-realistic-glas-epoxy-gelatin/46522/13); [another response describes back walls and a shadow plane](https://discourse.threejs.org/t/meshtransmissionmaterial-more-realistic-glas-epoxy-gelatin/46522/9). A separate BackSide wall mesh is not evidence of a particular `MeshTransmissionMaterial.backside` setting.

CodeSandbox returned Cloudflare 403 in the research environment. Exact reference tint, IOR, thickness, roughness, environment preset, model dimensions and object positions were not recovered. A screenshot alone does not determine those values. The new settings are authored for First Light's existing colours and geometry, not claimed to be copied from that demo.

[Three.js r167's physical-material documentation](https://github.com/mrdoob/three.js/blob/r167/docs/api/en/materials/MeshPhysicalMaterial.html) specifies opacity `1` with nonzero transmission. The [versioned Drei shader](https://github.com/pmndrs/drei/blob/v10.7.9/src/core/MeshTransmissionMaterial.tsx) demonstrates the host-discard capture and framebuffer sampling.

## Verification

Strict TypeScript, all **245 application tests across 30 files**, and the Pages-base production build pass. The exact component sourcebook/manifest/ZIP verifies against 104 source files. No lint script is configured. The existing Vite large-chunk advisory remains.

The coordinator reviewed the actual [desktop](previews/clearer-main-glass-desktop.png) and [390px mobile](previews/clearer-main-glass-mobile.png) screenshots. The [browser report](clearer-main-glass-verification.json) records:

- Both real main canvases retain one mesh and their original geometry (18,432 torus triangles and 4,620 panel triangles), original linear RGB tint, material/CSS opacity `1`, transmission `1`, thickness `0.41` and the updated optical uniforms. Their actual scene backgrounds are the generated 512px sRGB textures, with a nonblack midpoint `[197, 205, 217]`.
- Desktop High and Balanced use the unchanged six/four shader samples and complete 512/256px capture framebuffers, with zero readback GL errors. A same-view panel comparison at transmission `1` versus `0` changes mean RGB by approximately `17.4576` while opacity stays `1`.
- Real torus rotation changes its model matrix; focused and reduced-motion scenes settle without continuous draws. The native controls remain usable. The added unit regression also confirms changing the backdrop keeps the same loaded renderer, edited settings, field node and keyboard focus.
- True coarse-pointer/touch emulation at 390px selects Automatic/Balanced, renders both objects, stacks the cards and produces no horizontal overflow. The normal main hierarchy is retained, with no other GPU layers hidden for this check.
- No application page errors or console errors occurred. The desktop inspector caused two Canvas2D repeated-readback performance hints by calling `getImageData`; these are explicitly classified in the report. The remaining mobile check avoids repeated inspector readbacks and has no warnings. No source change was needed for those probe hints.

Browser evidence uses Linux Chromium/SwiftShader. It does not establish physical Safari/Apple GPU smoothness, an FPS target or touch-swipe behavior. HTTP request health was not asserted by this probe. The generated backdrop is verified as a local `CanvasTexture`, rather than a fetched image. Earlier detailed failure/workspace coverage is retained by the focused tests; those browser scenarios were not all repeated for this optical change.

The checks above describe the local implementation before publication. The approved release uses the existing [Pages workflow](https://github.com/interfacethegreatest/first-light/actions/workflows/pages.yml); its successful deployment and the public page must be verified separately.
