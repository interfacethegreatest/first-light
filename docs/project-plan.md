# First Light: initial project plan

## Requirements

First Light is a new local repository for implementing research results as web applications. No research subject, audience, or domain-specific feature has been selected yet. This first increment supplies a reusable browser application and a documented evidence-to-implementation workflow.

- Record research sources with a title, HTTP(S) URL, and optional notes.
- Connect a finding and a proposed implementation to an existing source.
- Track each implementation as planned, building, or validated. Status is user-reported; it is not proof of scientific validation.
- Retain records in this browser with localStorage and allow JSON export for backup.
- Start with an honest empty state; include no invented papers or findings.
- Provide setup, research, architecture, and verification documentation.
- The first increment is local. Publish or deploy only when the user requests it; the Pages follow-up below is now authorized.

## Architecture

Use React, TypeScript, and Vite for a client-only starter. Keep presentation in `src/App.tsx` and `src/App.css`; keep data validation and state/storage handling in `src/workspace.ts` and `src/useWorkspace.ts`. Domain records are independent of presentation. Browser storage is convenience storage on one origin/device, not a shared database or secure storage for sensitive research. No server, authentication, analytics, external AI integration, or domain-specific research claims are included.

The evidence chain is: source → finding → implementation decision → verification. Source notes and findings remain distinct from observed verification results. `docs/` describes the process; `templates/` holds reusable research records. A future application can replace the persistence layer without replacing the record types.

## Acceptance criteria

1. A clean checkout installs with `npm ci` and runs with `npm run dev` on Node.js 22.12+ or 24+.
2. A researcher can add an HTTP(S) source, connect a finding and implementation, and change implementation status.
3. Invalid URLs, blank fields, and references to missing sources are rejected with useful messages.
4. Saved records survive a reload. Storage failures are visible; corrupt or unsupported stored records are not silently overwritten.
5. JSON export includes all current records. No evidence is prepopulated.
6. Forms have labels, feedback is announced, and the layout works on desktop and mobile.
7. Type checks, automated behavior tests, and a production build pass. Browser checks exercise the core flow and reload.
8. The initial local increment has no remote or deployment automation. The separately authorized Pages follow-up adds a manual deployment workflow.

## Ownership and sequencing

- Coordinator: this plan, README, tooling/configuration, domain model, persistence hook, integration, final verification, and local Git repository.
- Interface agent: only `src/App.tsx`, `src/App.css`, and `public/first-light.svg`.
- Research documentation agent: only `docs/research-workflow.md`, `docs/architecture.md`, `templates/research-brief.md`, `templates/source-review.md`, `templates/implementation-decision.md`, and `CONTRIBUTING.md`.
- Verification agent, after implementation: only `tests/` and a read-only review of the combined code. Changes to implementation are returned to the coordinator.

The interface and research documentation tasks can run independently against the agreed contract. Integration and verification follow implementation sequentially.

## Open decisions

- First research question and source materials.
- Intended application users and measurable domain outcomes.
- Backend, collaboration, and authentication needs, if any.
- License. No license grant is assumed.

## Authorized GitHub Pages follow-up

The user requested publication to GitHub Pages and a working link. Target a new public `interfacethegreatest/first-light` repository, with the app served at `/first-light/`.

- Requirements: retain the existing application behavior and browser-local data, provide a reproducible static deployment, and return a verified live link.
- Architecture: configurable Vite asset base, explicit base-aware favicon, and a manually dispatched GitHub Actions workflow using the Pages artifact/deployment actions. No backend or research data upload is added.
- Acceptance: existing checks pass for the Pages build; production scripts, styles, and favicon resolve beneath the project path; core browser behavior works at that path; the GitHub workflow succeeds; and the live URL is checked before reporting publication.
- Ownership: coordinator owns all deployment/configuration/documentation changes and remote operations. The existing verification agent performs an independent read-only path review. Remote deployment follows local verification sequentially.
- Current blocker: GitHub authenticated successfully, but both GraphQL and REST repository creation were rejected as inaccessible to the integration. The deployment remains local until the repository and Pages access are supplied.
