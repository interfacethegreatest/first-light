# Source section expansion and reveal

## Requirements

Expand Research library to fit new source sections before revealing them. Use the existing Framer Motion package and `motion.div` elements. Stagger newly introduced panels and their heading, text and Sun badge. Retain the existing template → SourceSection → NewUserCard rendering chain and the shared App.css / card module styling.

Existing panels stay visible and mounted. Preserve natural content sizing, native controls, drafts, storage, the copied Sun scene, shared glass, borders and radii. Reduced motion, focused output and browsers without ResizeObserver settle immediately. This change requires separate deployment approval.

## Architecture

`AnimatedHeight` reports settlement after releasing its numeric height back to `auto` with visible overflow. Its callback distinguishes normal completion from immediate settlement. A children-commit measurement and ResizeObserver share the current baseline; callback changes do not restart measurement. Cancelled, stale or unmounted animations cannot release new children.

`SourceSections` keeps newly mounted cards hidden and inert while their normal layout size is measured. It reveals the pending batch only when the height wrapper settles. Each new keyed `motion.div` receives a small batch-relative delay. Existing entries keep their state and identity. Initial sections, reduced motion and other immediate settlements use the `settled` variant without delays.

NewUserCard inherits `hidden`, `visible` and `settled` labels on motion divs. Its content follows the panel reveal. The Sun badge animates opacity so its existing CSS centring transform survives. Standalone cards remain visible without a motion ancestor. No source records, templates, Sun assets or global CSS values change.

## Acceptance criteria

1. A new card occupies measurable layout space but stays hidden and inert until the parent finishes expanding.
2. Real height completion releases the pending batch; a fixed timeout does not gate the sequence. Rapid additions retarget height and stale completions cannot reveal them early.
3. Newly added panels and their content reveal in order. Existing sections and Canvas nodes stay mounted and do not replay their entrance.
4. Initial content, reduced motion, focused descendants and missing ResizeObserver show usable content immediately. Live preference/focus changes cancel pending travel and delays.
5. Controls remain native, title controls horizontal, body paragraphs plain, and the 50px Sun badge centred. Glass, border width, radius, padding and responsive fit remain intact.
6. Relevant behavior tests, TypeScript and the Pages-path build pass. Browser checks verify ordering, final geometry, identity and interaction. Any limitation in measuring smooth playback is reported explicitly.

## Ownership and sequence

- Height agent: only `src/components/sources/AnimatedHeight.tsx`; completion means a guarded settlement API and preserved height lifecycle.
- Card agent: only `src/components/cards/newUserCard/NewUserCard.tsx`; completion means inherited div variants with unchanged layout and standalone behavior.
- Coordinator: this plan, SourceSections integration, provenance, review and Git/PR work. Integration follows the two independent component changes.
- Verification agent: after integration, `tests/animated-height.test.tsx`, `tests/source-section-sequence.test.tsx`, and browser artifacts outside the repository. Completion means behavior results, relevant checks and explicit remaining limits. No production edits.

No agent commits, installs packages, deploys or delegates further. Publication is a separate action after review and user approval.
