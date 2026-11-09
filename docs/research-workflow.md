# From research to a web application

First Light starts without a research topic or findings. Choose the first question before building a domain-specific feature. The workspace records sources and implementation decisions; the templates hold the fuller reasoning and verification evidence.

## 1. Define the question

Copy [the research brief](../templates/research-brief.md) into a new, clearly named document under `docs/`. Identify the intended users, the decision the research should inform, and the observable application outcome. Set scope, exclusions, success measures, and a stopping point for research. Record assumptions as assumptions.

## 2. Collect and review sources

Add each source to the workspace with its title, HTTP(S) URL, and notes. Use [a source review](../templates/source-review.md) to capture authors, publication and access dates, version or DOI, and the exact section supporting a finding. Prefer original studies, datasets, standards, or official documentation where appropriate. A secondary summary can help locate evidence, but should not replace reading the underlying material.

Assess the methods, sample or setting, uncertainty, limitations, funding or conflicts when relevant, and whether the result applies to the intended users. Distinguish what the source reports from your interpretation. Record contradictory results and material gaps alongside supporting evidence. A source link alone does not establish reliability.

## 3. Make an implementation decision

Create a workspace decision connecting one source to a specific finding and a proposed implementation. Complete [an implementation decision](../templates/implementation-decision.md) before substantial feature work. Link additional source reviews there if the decision draws on multiple sources; the starter workspace supports one source reference per decision.

Describe the exact user-visible behavior, why the evidence supports it, alternatives considered, and the measurable acceptance criteria. Define how the feature could fail, what would change the decision, and what remains uncertain. Link the decision to the eventual issue, code path, or change identifier.

## 4. Build and verify

Implement the smallest behavior that tests the decision. Record relevant dependencies, source or dataset versions, configuration, random seeds if applicable, and commands needed to repeat the result. Use small synthetic or approved fixtures when real research data is not suitable for the repository. Respect source licenses and data permissions when copying material or datasets.

Verify at two levels:

- **Implementation:** Does the web application meet its acceptance criteria? Capture automated tests and relevant manual checks, including accessibility and device behavior.
- **Research outcome:** Does the proposed behavior deliver the intended effect for the intended population? Document the evaluation method, measured result, uncertainty, and limitations. Working code does not confirm a scientific claim.

For research involving sensitive information or people, record the applicable access, consent, and handling requirements before collecting data. Browser storage in this starter is not suitable for sensitive research records.

## 5. Record the outcome and revisit it

Use workspace statuses consistently: `planned` means the implementation is proposed; `building` means work is underway; `validated` means a contributor reports completing the documented implementation checks. The last status is not independent research validation. Store the actual verification results and any domain evaluation in the decision document.

Update the decision when evidence changes. Preserve the reason for a superseded decision and link its replacement. Keep a traceable chain from source and finding to decision, code change, and verification result.

## Storage and handoff

Workspace records stay in localStorage for the current browser and origin. They are not committed with the repository, synced, or shared with collaborators. Export JSON regularly and before changing browser, origin, or storage settings. The starter can export records but has no import interface; keep important conclusions and verification records in versioned documents as well. A future import or shared-storage feature requires its own acceptance criteria.

See [the project plan](project-plan.md) for this increment's acceptance criteria and [the architecture](architecture.md) for implementation boundaries.
