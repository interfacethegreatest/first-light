# Initial verification

Verified on 2026-11-09 using Node.js 24.22.1, npm 11.9.0, and headless Chromium 156.0.8078.79 on Linux. These checks verify the starter's implementation, not research validity. No real research findings have been entered.

## Automated checks

- `npm ci --no-fund --offline`: passed with the previously populated npm cache, confirming the lockfile supports a clean install. A fresh machine should use `npm ci` with registry access.
- `npm run check`: passed strict TypeScript checks, all 28 Vitest tests across two files, and a production build.
- Relative Markdown links: checked and resolved.

Tests cover source validation and evidence references, persisted-data validation, status updates, exported JSON, remount persistence, unreadable/corrupt browser storage, failed writes, detected cross-tab conflicts, and React StrictMode.

## Browser checks

The coordinator exercised the following with Playwright and Chromium, then reviewed desktop and mobile screenshots. All passed. To repeat manually, run `npm run dev` and use a fresh browser profile or test-only storage; these checks create synthetic records.

1. Confirm the initial workspace is empty and decision creation is disabled until a source exists.
2. Press Tab from page load and activate the skip link.
3. Submit a blank source. Confirm a useful error. Enter a title with a `javascript:` URL; confirm rejection and that the entered title is preserved.
4. Add a source using a clearly marked test title, `https://example.org/research-fixture`, and optional notes. Confirm the form clears and the source becomes available for decisions.
5. Submit a decision without a finding. Confirm rejection. Add a synthetic finding and implementation plan, then confirm the decision links to the source.
6. Set its status to `validated`, reload, and confirm the record and status remain.
7. Export the workspace. Confirm `first-light-workspace.json` contains version 1, the source, and the linked decision with the current status.
8. Check widths of 1440, 768, 390, and 320 pixels. Confirm there is no horizontal page overflow and the forms remain usable.
9. Open a second tab before adding another source in the first. Add a different source in the stale tab. Confirm the stale tab warns and does not overwrite the first tab's saved change.
10. In an isolated test profile, set `first-light.workspace.v1` to malformed JSON. Reload and add a source. Confirm the warning remains visible and the malformed stored original remains untouched.
11. Simulate a `QuotaExceededError` from `Storage.prototype.setItem` in an isolated browser context. Add a source. Confirm a storage warning and that the new source remains visible in the current session.

No browser JavaScript errors were observed in the main workflow. Browser test data was confined to temporary browser contexts and was not seeded into the app or repository.

## Review and remaining limits

Three subagents handled separate files for interface, research documentation, and domain/persistence tests. The coordinator reviewed their results, integrated them, replaced a font-dependent icon, and adjusted empty feedback regions to remain available to assistive technologies before rerunning checks.

No cross-browser or screen-reader certification was performed. Cross-tab detection is a best-effort guard, not atomic collaboration. Data is browser-local; JSON export has no import interface yet. The first research topic, audience, application outcomes, licensing, remote repository, and hosting remain undecided. No publication or deployment was performed.
