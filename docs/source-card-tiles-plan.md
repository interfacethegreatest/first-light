# Fixed source card decorations

The fixed canvas, tracks, tile positions and loader travel endpoints remain current. The newer [matching spark tile design](matching-spark-tiles-plan.md) updates the paint and stroke thickness to the shared 1px hero-grid design; visual measurements below describe the earlier styling.

## Requirements and architecture

Keep the section component, reusable template object and rendered card separate. Extract the decorative tile/loader markup into `CardTiles.tsx` and its own CSS module. NewUserCard continues to own its title, plaintext/output body, controls and copied Sun scene.

Use the short 374px card as the reference for approximate percentage-to-pixel conversion: a 374×160px decorative canvas, four 93px columns and rows of 28, 52, 52 and 14px. Tile 15 and loader animation endpoints also use fixed pixel lengths. Card content retains natural height. A separate centred viewport clips the fixed canvas to the available width instead of stretching it.

Give generated cards a local inner edge highlight and contact shadow layered with the existing shared glass shadow. Keep central glass tint/blur, border/radius, form styles, Sun rendering, parent expansion and child reveal sequence intact. Use no new dependencies or JavaScript layout measurement for decoration sizing.

## Acceptance criteria

1. Short, medium and long source sections have different natural heights but identical decorative canvas, grid-track and tile dimensions.
2. Further output growth does not change tile geometry. Loader animation endpoints are fixed lengths and stay consistent across card heights.
3. At 1440, 390 and 320px, the fixed pattern clips cleanly with no document overflow. Decorative layers remain pointer-inert; the 50px Sun badge stays centred.
4. Existing section/Canvas identity, native controls, drafts and storage survive. Reduced motion suppresses decoration animations and transitions.
5. Local card shadows and edge highlights increase depth while shared glass, 1px borders and 7px corners remain effective.
6. Existing regression tests, TypeScript and the Pages-path build pass. Browser geometry, hover endpoints and real Sun/styling checks pass. Provide the changed code and links to complete isolated files.

## Ownership and sequencing

- Tile agent: new `CardTiles.tsx` and `cardTiles.module.css` only.
- Documentation agent: `docs/calendar-new-user-card-provenance.md` only; describe current contracts and distinguish earlier evidence from current validation.
- Coordinator: this plan, NewUserCard import/extraction, removal of old decoration CSS, local depth styling, review and Git/PR work. Integrate after the tile component handoff.
- Verification agent: browser probe and artifacts outside the repository only. Prepare independently and run after the final production build. No extra CSS snapshot unit tests.

No agent installs packages, deploys or delegates. Deployment requires approval for this increment.
