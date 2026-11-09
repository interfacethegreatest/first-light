# Contributing to First Light

First Light is a local starter for implementing research results as web applications. Its first research question and audience remain open. Read [the project plan](docs/project-plan.md), [the architecture](docs/architecture.md), and [the research workflow](docs/research-workflow.md) before adding domain-specific features.

## A reviewable change

1. Define the problem, users, scope, and measurable acceptance criteria.
2. For a research-informed feature, complete the [brief](templates/research-brief.md), [source review](templates/source-review.md), and [decision record](templates/implementation-decision.md) as needed. Link the relevant evidence to the change.
3. Keep changes bounded. In parallel work, assign explicit file ownership and keep dependent work sequential.
4. Keep domain validation separate from presentation. Preserve source references and state-format compatibility when changing persistence.
5. Run relevant checks and review user-visible behavior. Record observed results and remaining uncertainty.

Do not invent findings, citations, or verification results. Treat implementation tests and scientific validation as separate questions. Prefer small, synthetic or approved fixtures over private research data.

## Local verification

Follow [the README](README.md) to install and start the application. Before handing off changes, run:

```sh
npm run typecheck
npm test
npm run build
```

For changes to the core workflow, also check adding a source, linking a decision, changing its status, reloading, and exporting JSON in the browser. Check keyboard use, form feedback, and a narrow viewport for interface changes. Add behavior tests when a meaningful new requirement or regression needs coverage; avoid tests that merely repeat implementation details.

## Data and handoff

Browser workspace records are stored in localStorage and are not part of Git history or shared with collaborators. Export important records regularly. The starter has no import interface, so preserve durable reasoning and verification results in versioned documents. Keep secrets and sensitive research data out of the repository and browser workspace.

Report what changed, what was verified, and remaining risks. Do not publish or deploy without the user's approval. Repository ownership, remote visibility, and licensing are future decisions.
