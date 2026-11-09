# Architecture

First Light is a client-only React application written in TypeScript and served during development by Vite. Its first increment is a research workspace and a foundation for future web applications. No research domain or production infrastructure has been selected.

## Boundaries

| Location | Responsibility |
| --- | --- |
| `src/main.tsx` | Mount the application with React StrictMode. |
| `src/App.tsx`, `src/App.css` | Present sources and decisions, manage form drafts and feedback, and offer JSON download. |
| `src/workspace.ts` | Define the domain records and validate incoming values and stored data. |
| `src/useWorkspace.ts` | Coordinate React state, domain operations, browser persistence, warnings, and JSON export. |
| `docs/`, `templates/` | Preserve the research process, rationale, reproducibility details, and verification results. |
| `tests/` | Verify the core workflow and relevant failure behavior. |

The interface depends on the workspace hook. The hook depends on the domain model and browser storage. Domain records do not depend on React. This keeps a later storage replacement separate from presentation and data meaning.

## Data model

The workspace has a versioned envelope (`version: 1`) containing `sources` and `decisions` arrays. It starts empty.

- A **research source** has an ID, title, HTTP(S) URL, notes, and creation timestamp.
- An **implementation decision** has an ID, an existing source ID, finding, proposed implementation, creation timestamp, and status (`planned`, `building`, or `validated`).

A decision references one source in the starter. Additional evidence and verification outcomes belong in its [decision document](../templates/implementation-decision.md). Status is manually reported and does not establish scientific validity. The code contract is recorded in [workspace-contract.md](../src/workspace-contract.md).

## Interaction and persistence

The interface collects source or decision input. Domain validation rejects empty required fields, unsafe URL schemes, and decisions referring to absent sources. Valid changes update the current session and are saved through the hook. Saved state is checked before being accepted on a later load. Storage warnings must remain visible; corrupt or unsupported existing data must not be silently overwritten.

localStorage is scoped to one browser and origin. It supplies convenience persistence, not a database, collaboration, access control, or a backup service. A storage failure leaves the session usable but must warn the user. JSON export preserves the current workspace for backup. There is no import or deletion interface in this increment. Do not store sensitive research records in the starter.

## Evolution

Choose a research question and application audience before adding domain-specific behavior. Add backend storage, authentication, collaboration, or external integrations only when requirements justify them. A future persistence implementation should retain validation and source-to-decision references, with an explicit migration for changes to the stored format.

The [GitHub Pages workflow](../.github/workflows/pages.yml) performs checks and builds a static site with `VITE_BASE_PATH` set to the repository path. It deploys only when manually triggered. Local development defaults to `/`. No runtime server or credentials are included in the deployed application. Publishing or deploying requires the user's approval; the current Pages publication has been requested. See [the deployment guide](github-pages.md) for the remaining GitHub access setup and [the project plan](project-plan.md) for requirements and acceptance criteria.

GitHub Pages project sites on the same `owner.github.io` domain share a localStorage origin. Localhost records do not transfer to the hosted site. Keep sensitive research records out of browser storage.
