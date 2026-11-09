# First Light

Turn research findings into web applications, with a traceable path from evidence to implementation.

**Live application:** <https://interfacethegreatest.github.io/first-light/>

This is a new local React + TypeScript + Vite starter. Its first research topic and application audience are still open. The included web workspace lets you record sources, link findings to implementation decisions, track progress, and export your records. It starts empty, without sample papers or claims.

## Run locally

Use Node.js 24 LTS (or Node.js 22.12+). With nvm, run `nvm use` first.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally <http://127.0.0.1:5173>. Keep using the same origin and port to access the same browser records.

## First research-to-application cycle

1. Copy [the research brief](templates/research-brief.md) into `docs/` and define the question, intended users, and observable application outcome.
2. Review the underlying evidence with [the source review](templates/source-review.md). Record limitations and conflicting findings.
3. Add a source in the app. Link a specific finding to a proposed implementation.
4. Complete [the implementation decision](templates/implementation-decision.md), including measurable acceptance criteria, before building the feature.
5. Implement and verify the behavior. Record the actual results in the decision document; use the app to track progress.

`Validated` is a user-reported implementation status. It does not establish scientific validity. Follow [the research workflow](docs/research-workflow.md) for the distinction and review process.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run typecheck` | Check strict TypeScript types. |
| `npm test` | Run automated behavior tests once. |
| `npm run test:watch` | Run tests while making changes. |
| `npm run build` | Type-check and build into `dist/`. |
| `npm run preview` | Serve the built app locally. |
| `npm run check` | Run type checks, tests, and production build. |

## Project map

```text
src/
  App.tsx, App.css       Web workspace and forms
  workspace.ts          Domain types and validation
  useWorkspace.ts       Browser state, persistence, export
  main.tsx, index.css   Application entry and base styles
docs/                   Plan, architecture, research workflow
templates/              Research brief, source review, decision record
tests/                  Behavior and persistence verification
```

See [the project plan](docs/project-plan.md) for requirements and acceptance criteria, [the architecture](docs/architecture.md) for technical boundaries, and [CONTRIBUTING.md](CONTRIBUTING.md) for the change workflow.

The [initial verification record](docs/verification.md) lists the checks performed and steps to repeat the browser workflow.

## Calendar star background

First Light uses the Three.js background from Calendar4, retaining its 7,500 stars, slow rotation, bloom, and black backdrop. The interface uses dark translucent surfaces to keep the background visible and the research forms readable. Reduced-motion preferences show a static scene; unavailable WebGL or a failed renderer download leaves a black background and a usable workspace.

See [the source and verification notes](docs/calendar-stars-provenance.md) and the [desktop](docs/previews/calendar-stars-desktop.png) and [mobile](docs/previews/calendar-stars-mobile.png) previews. This update was published with the user's approval through [the successful Pages workflow](https://github.com/interfacethegreatest/first-light/actions/runs/42620982549).

## Calendar interface animations

This branch also reuses Calendar4's spring panel entrances, gentle pointer tilt, rolling button labels, and slow border-color cycle. Focused fields remain steady, touch disables tilt, and reduced motion suppresses the new animation while preserving form values and focus.

Watch the [animation preview](docs/previews/calendar-motion-demo.mp4) and see [the source mapping and verification record](docs/calendar-motion-provenance.md). Publication of this interface-motion update is approved; deployment verification is in progress.

## Storage and current limits

Records live in localStorage in one browser and origin, under `first-light.workspace.v1`. They are not saved to Git or shared between devices. Export JSON regularly. There is no import or deletion interface yet; keep important research reasoning in versioned documents as well. Do not put sensitive research data in this starter.

If stored data is corrupt or from an unsupported version, the app preserves the original and warns that new records are session-only. Storage write failures and detected changes from another tab also produce a warning; export before closing or reloading. The starter is intended for one active tab, not concurrent editing.

Each decision links to one source in the web workspace. Its document can cite additional evidence. No backend, authentication, collaboration, or AI service has been configured. The research domain and license remain open decisions. No license grant is included.

## Repository

The repository uses the `main` branch. A manually triggered [GitHub Pages workflow](.github/workflows/pages.yml) checks, builds, and publishes the app under the repository's name. See [the deployment guide](docs/github-pages.md) for setup and verification.

The [GitHub repository](https://github.com/interfacethegreatest/first-light) is connected and GitHub Pages is enabled. The app is published at <https://interfacethegreatest.github.io/first-light/>. Future deployments use the manual workflow described above.
