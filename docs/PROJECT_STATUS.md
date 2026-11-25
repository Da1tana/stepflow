# StepFlow — project status

Last verified: 2026-11-25

## Product summary

StepFlow is a local-first Manifest V3 browser extension intended to record browser actions and turn them into step-by-step instructions. The current milestone is Recording MVP without screenshots.

## Repository state

- Repository: [Da1tana/stepflow](https://github.com/Da1tana/stepflow)
- Default branch: `main`
- Foundation PR: [#1](https://github.com/Da1tana/stepflow/pull/1) — merged.
- Active workstream PR: [#2](https://github.com/Da1tana/stepflow/pull/2) — open draft, not merged.
- Active branch: `feat/recording-mvp`.
- The branch is based on current `main`; inspect compare before every task.
- All current recording work remains on the feature branch. No changes have been merged into `main`.

## Implemented in main

- Manifest V3 extension shell with ES-module service worker.
- Popup and Side Panel UI with dark design tokens.
- Local settings storage using `chrome.storage.local`.
- RU/EN localization using `chrome.i18n`.
- Message router and separated app handlers.
- Shared constants, messaging, storage, i18n, and logging modules.
- Core guide model.
- Static validation script, Node unit tests, Playwright E2E setup, GitHub Actions CI, and packaging.

## Implemented on feat/recording-mvp

### Pure recording core

- `src/core/privacy.js`: allowlisted element roles, bounded labels, conservative rejection of email-like strings, long digit sequences, and token-like labels; textbox/password/select labels are blanked.
- Safe page-origin extraction drops path, query, fragment, and credentials.
- `src/core/step-label.js`: Russian and English action titles.
- `src/core/restricted-url.js`: rejects browser-internal pages, Chrome Web Store, local files, malformed/non-web URLs, and obvious PDF paths.
- `src/core/recording.js`: serializable session creation and immutable append/pause/resume/stop/cancel transitions.
- Four unit-test files cover privacy, labels, URL restrictions, and session state.

### First browser-integration slice

- Manifest permissions: `sidePanel`, `storage`, `activeTab`, and `scripting`. No persistent host permissions, `tabs` permission, or static content scripts.
- Popup starts recording after explicit user invocation and requests the side panel.
- `src/content/recorder.js` captures only trusted clicks on a limited allowlist of interactive elements.
- The content script never reads field values, form contents, page text, HTML, or selectors. For eligible non-input controls it considers only explicit `aria-label` / `title` metadata.
- Service-worker handlers validate extension sender, top-frame/tab identity, active session tab, and sanitize descriptors again.
- One active draft is persisted under `sf.recordingDraft` in `chrome.storage.local`.
- Application state exposes the recording draft.

## Not implemented yet

- Live step display in the side panel.
- Stop and save a guide; cancel and discard a draft.
- Same-origin navigation reinjection and cross-origin pause/recovery.
- Tab-close and service-worker restart recovery.
- Dedicated recording E2E tests for real trusted clicks and privacy boundaries.
- Screenshots, guide editor, and export.

## Privacy constraints

- Capture only trusted click events (`isTrusted === true`).
- Never collect input values, passwords, textarea/select values, contenteditable contents, form contents, page HTML/text, document title, URL path/query/fragment.
- Do not use arbitrary page text as a fallback.
- Sanitize at the content-script boundary and validate/sanitize again in the service worker.
- Regex redaction is defense-in-depth, not a guarantee of privacy.

## Project map / source of truth

- [AI_HANDOFF.md](AI_HANDOFF.md) — instructions for any AI/developer continuing the project.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — this verified status.
- [ROADMAP.md](ROADMAP.md) — milestone sequence and acceptance criteria.
- [CHANGELOG.md](CHANGELOG.md) — chronological record of meaningful changes.
- [DECISIONS.md](DECISIONS.md) — decisions, rationale, and unresolved technical questions.
- [plans/recording-mvp.md](plans/recording-mvp.md) — detailed recording proposal.
- [ARCHITECTURE.md](ARCHITECTURE.md) — current architecture.

## Verification

- CI run [#30](https://github.com/Da1tana/stepflow/actions/runs/45593035127) for browser-integration commit `bbb0e6f` passed: manifest/permissions/i18n validation, unit tests, Chromium installation, clean package build, and existing Chromium E2E suite.
- The E2E suite verifies the existing popup/panel flows and localization. Dedicated real-click recording/privacy E2E tests are still outstanding.
- No local terminal execution is available in the current GitHub-only workflow.

## Immediate next actions

1. Run CI against the current browser-integration head and fix any failures.
2. Add side-panel live step display and stop/save/cancel controls.
3. Add navigation, tab-close, and restart recovery.
4. Add recording-specific E2E tests for trusted clicks and privacy boundaries.
