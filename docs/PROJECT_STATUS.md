# StepFlow — project status

Last verified: 2026-11-25

## Product summary

StepFlow is a local-first Manifest V3 browser extension intended to record browser actions and turn them into step-by-step instructions. The current milestone is Recording MVP without screenshots.

## Repository state

- Repository: [Da1tana/stepflow](https://github.com/Da1tana/stepflow)
- Default branch: `main`
- Foundation PR: [#1](https://github.com/Da1tana/stepflow/pull/1) — merged.
- Active workstream / documentation PR: [#2](https://github.com/Da1tana/stepflow/pull/2) — open draft, not merged.
- Active branch: `feat/recording-mvp`.
- The feature branch was synchronized with `main` before implementation. Recheck compare before every task.
- The branch currently contains project documentation and the first recording-core slice. The source code changes are still only on the feature branch.

## Implemented in main

- Manifest V3 extension shell with ES-module service worker.
- Popup and Side Panel UI with dark design tokens.
- Local settings storage using `chrome.storage.local`.
- RU/EN localization using `chrome.i18n`.
- Message router and separated app handlers.
- Shared constants, messaging, storage, i18n, and logging modules.
- Core guide model.
- Static validation script and Node unit tests.
- Playwright E2E setup and GitHub Actions CI.
- Packaging and standalone Chromium scripts.

The current manifest permissions are `sidePanel` and `storage`. There are no host permissions, `tabs` permission, or statically declared content scripts in the foundation.

## Implemented on feat/recording-mvp

First vertical slice of pure recording-domain logic:

- `src/core/privacy.js`: allowlisted element roles, bounded labels, conservative rejection of labels containing email-like strings, long digit sequences, or token-like values; input/password/select labels are always blanked.
- `src/core/privacy.js`: safe page-origin extraction drops path, query, fragment, and credentials.
- `src/core/step-label.js`: Russian and English action titles.
- `src/core/restricted-url.js`: rejects browser-internal protocols, local files, Chrome Web Store, malformed/non-web URLs, and obvious PDF paths.
- `src/core/recording.js`: serializable session creation and immutable append/pause/resume/stop/cancel transitions.
- Four unit-test files cover privacy, labels, URL restrictions, and session state.

These are pure modules only. They do not yet capture browser events or write recording data to extension storage.

## Not implemented yet

- Add `activeTab` and `scripting` permissions to manifest and validator.
- Inject a recorder content script after a user gesture.
- Capture only trusted, supported click events and send safe descriptors.
- Validate message sender/tab and sanitize again in service worker.
- Persist draft/session and saved guides.
- Display live steps and start/stop/cancel controls in popup and side panel.
- Handle same-origin navigation, cross-origin permission revocation, tab close, and service-worker restart.
- Recording-specific browser E2E tests.
- Screenshots, guide editor, and export.

## Privacy constraints

- Capture only trusted click events (`isTrusted === true`).
- Never collect input values, passwords, textarea/select values, contenteditable contents, form contents, page HTML/text, document title, URL path/query/fragment unless a future reviewed decision explicitly allows a safe subset.
- Do not use arbitrary page text as a fallback.
- Sanitize at the content-script boundary and validate/sanitize again in the service worker.
- Regex redaction is only defense-in-depth, not a guarantee of privacy.

## Project map / source of truth

- [AI_HANDOFF.md](AI_HANDOFF.md) — instructions for any AI/developer continuing the project.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — this verified status.
- [ROADMAP.md](ROADMAP.md) — milestone sequence and acceptance criteria.
- [CHANGELOG.md](CHANGELOG.md) — chronological record of meaningful changes.
- [DECISIONS.md](DECISIONS.md) — decisions, rationale, and unresolved technical questions.
- [plans/recording-mvp.md](plans/recording-mvp.md) — detailed recording proposal.
- [ARCHITECTURE.md](ARCHITECTURE.md) — current architecture.

## Verification

- PR #1 reports that foundation validation, unit tests (3/3), and E2E tests (12/12) passed at the time of that PR. This is historical evidence only.
- Previous CI run for commit `70e4444` completed successfully before the recording-core files were added; it does not verify the current implementation.
- Current code has not been executed locally in this GitHub-only environment.
- Wait for a CI run associated with the latest feature-branch commit before marking tests passed.

## Immediate next actions

1. Run CI against the current recording-core commit and fix any failures.
2. Implement manifest permissions, popup start flow, and programmatic content-script injection.
3. Add trusted click capture with strict DOM data minimization.
4. Add service-worker validation and local draft persistence.
5. Add side-panel live display and stop/save/cancel controls.
6. Add navigation and restart recovery E2E tests; update the project map.
