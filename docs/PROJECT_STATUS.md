# StepFlow — project status

Last verified: 2026-11-25

## Product summary

StepFlow is a local-first Manifest V3 browser extension intended to record browser actions and turn them into step-by-step instructions. The current milestone is Recording MVP without screenshots.

## Repository state

- Repository: [Da1tana/stepflow](https://github.com/Da1tana/stepflow)
- Default branch: `main`
- Foundation PR: [#1](https://github.com/Da1tana/stepflow/pull/1) — merged.
- Previous workstream PR: [#2](https://github.com/Da1tana/stepflow/pull/2) — closed, never merged; superseded after a branch-tree recovery.
- Active workstream PR: [#3](https://github.com/Da1tana/stepflow/pull/3) — open draft, not merged.
- Active branch: `feat/recording-mvp-recovery`.
- The branch is based on current `main`; inspect compare before every task.
- All recording work remains on the active feature branch. No changes have been merged into `main`.

## Implemented in main

- Manifest V3 extension shell with ES-module service worker.
- Popup and Side Panel UI with dark design tokens.
- Local settings storage using `chrome.storage.local`.
- RU/EN localization using `chrome.i18n`.
- Message router and separated app handlers.
- Shared constants, messaging, storage, i18n, and logging modules.
- Core guide model.
- Static validation script, Node unit tests, Playwright E2E setup, GitHub Actions CI, and packaging.

## Implemented on feat/recording-mvp-recovery

### Pure recording core

- `src/core/privacy.js`: allowlisted element roles, bounded labels, conservative rejection of email-like strings, long digit sequences, and token-like labels; textbox/password/select labels are blanked.
- Safe page-origin extraction drops path, query, fragment, and credentials.
- `src/core/step-label.js`: Russian and English action titles.
- `src/core/restricted-url.js`: rejects browser-internal pages, Chrome Web Store, local files, malformed/non-web URLs, and obvious PDF paths.
- `src/core/recording.js`: serializable session creation and immutable append/pause/resume/stop/cancel transitions.
- Unit tests cover privacy, labels, URL restrictions, recording transitions, guide conversion, and recording lifecycle recovery.

### First browser-integration slice

- Manifest permissions: `sidePanel`, `storage`, `activeTab`, and `scripting`. No persistent host permissions, `tabs` permission, or static content scripts.
- Popup starts recording after explicit user invocation and requests the side panel.
- `src/content/recorder.js` captures only trusted clicks on a limited allowlist of interactive elements.
- The content script never reads field values, form contents, page text, HTML, or selectors. For eligible non-input controls it considers only explicit `aria-label` / `title` metadata. `tests/unit/recorder.test.mjs` now guards these boundaries with a fake DOM harness; real browser capture remains a separate acceptance gap.
- Service-worker handlers validate extension sender, top-frame/tab identity, active session tab, and sanitize descriptors again.
- One active draft is persisted under `sf.recordingDraft` in `chrome.storage.local`.
- Application state exposes the recording draft.
- Side panel displays live steps and exposes finish/save and cancel actions.
- Finishing a non-empty recording converts it into a local guide; guide persistence and draft clearing are written together in one storage update.
- Cancelling clears the draft without creating a guide.
- Tab lifecycle coordinator pauses a draft on navigation start, attempts recorder reinjection after completion, resumes only after successful injection, and preserves the paused draft if access is denied.
- Closing the recorded tab preserves the draft in a paused state.

## Not implemented yet

- Real Chromium verification of navigation reinjection and cross-origin pause/recovery.
- Service-worker termination/restart persistence is covered by Chromium E2E: the test terminates the worker target through CDP, wakes it with a message, and verifies the persisted draft.
- Native browser-action popup, real trusted page clicks, and typed-value canaries through draft and saved-guide storage have been added as a Chromium E2E scenario; CI run #96 is pending. Do not count these as verified until the run passes.
- Screenshots, guide editor, and export.

## Privacy constraints

- Capture only trusted click events (`isTrusted === true`).
- Never collect input values, passwords, textarea/select values, contenteditable contents, form contents, page HTML/text, document title, URL path/query/fragment.
- Do not use arbitrary page text as a fallback.
- Sanitize at the content-script boundary and validate/sanitize again in the service worker.
- Regex redaction is defense-in-depth, not a guarantee of privacy.

## Project map / source of truth

- [PRODUCT_OVERVIEW.ru.md](PRODUCT_OVERVIEW.ru.md) — user-facing product explanation and target audience.
- [AI_HANDOFF.md](AI_HANDOFF.md) — instructions for any AI/developer continuing the project.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — this verified status.
- [ROADMAP.md](ROADMAP.md) — milestone sequence and acceptance criteria.
- [CHANGELOG.md](CHANGELOG.md) — chronological record of meaningful changes.
- [DECISIONS.md](DECISIONS.md) — decisions, rationale, and unresolved technical questions.
- [plans/recording-mvp.md](plans/recording-mvp.md) — detailed recording proposal.
- [ARCHITECTURE.md](ARCHITECTURE.md) — current architecture.

## Verification

- CI run [#90](https://github.com/Da1tana/stepflow/actions/runs/45605218843) passed on HEAD `e8ff75977a2afdfb4c7c84195dbf75e09beab075`: dependency installation, static validation, 26/26 unit tests, Chromium installation, clean extension build, 18/18 Chromium E2E tests (9 English + 9 Russian), screenshots, and build artifact upload.
- E2E verifies popup/panel smoke flows, draft save/cancel, guide rendering, service-worker messaging, tab-close preservation, and draft persistence after forced service-worker termination/restart in RU and EN. It does not exercise a real browser-action popup start followed by trusted clicks on a page.
- See [TEST_MAP.md](TEST_MAP.md) for the current test inventory and remaining acceptance gaps.
- No local terminal execution is available in the current GitHub-only workflow.

## Immediate next actions

1. Investigate a Chromium CDP/native-popup harness for real browser-action popup invocation and trusted-click capture without broadening permissions.
2. Add end-to-end typed-value privacy canaries that inspect draft and saved-guide storage.
3. Add real Chromium same-origin navigation reinjection and cross-origin pause/recovery tests.
4. Add a real-browser restricted-page start test.
5. Re-run CI and update the acceptance decision.
