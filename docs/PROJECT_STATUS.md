# StepFlow — project status

Last verified: 2026-11-25

## Product summary

StepFlow is a local-first Manifest V3 browser extension intended to record browser actions and turn them into step-by-step instructions with screenshots. The current product baseline is the foundation; recording is the next implementation milestone.

## Repository state

- Repository: [Da1tana/stepflow](https://github.com/Da1tana/stepflow)
- Default branch: `main`
- Foundation PR: [#1 — Фундамент расширения StepFlow на Manifest V3](https://github.com/Da1tana/stepflow/pull/1) — merged.
- Documentation / project-map PR: [#2](https://github.com/Da1tana/stepflow/pull/2) — open draft, not merged.
- Active workstream: `feat/recording-mvp`.
- Latest GitHub comparison: **16 commits ahead, 0 behind** `main`; merge base equals the current `main` commit.
- PR #2 diff contains six documentation files only. No source-code implementation changes are present.
- Branch synchronization is complete through a normal two-parent merge commit. No force-push or history rewrite was used.

## Implemented in main

The merged foundation includes:

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

## Not implemented yet

- Recording lifecycle and persistent draft state.
- Permission-gated injection of the recorder content script.
- Click capture and safe element descriptors.
- Step label generation and privacy sanitization.
- Live step display and stop/cancel flows in the popup and side panel.
- Navigation, tab-close, and service-worker restart recovery.
- Recording-specific unit and E2E tests.
- Screenshots, guide editor, and export.

## Recording MVP — verified technical direction

The detailed proposal is in [plans/recording-mvp.md](plans/recording-mvp.md). Official Chrome documentation confirms:

- `activeTab` is granted when the user invokes the extension, including opening its popup, and remains available across same-origin navigation; it is revoked when navigating to a different origin or closing the tab.
- `scripting.executeScript` requires the `scripting` permission plus host access; `activeTab` supplies temporary access for the invoked tab.
- The `chrome.tabs` namespace and tab lifecycle events do not generally require the `tabs` permission. That permission primarily unlocks sensitive `url`, `pendingUrl`, `title`, and `favIconUrl` properties in tab queries. The `activeTab` grant supplies temporary host access to the invoked tab.
- `chrome.sidePanel.open()` requires a user interaction. Invoke it directly from the popup's click handler; do not route it through an asynchronous service-worker message first.

Implementation must still verify these assumptions in the project's actual Chromium E2E environment. For robust navigation handling, listen to `tabs.onUpdated` using non-sensitive fields such as tab ID and loading status, pause on navigation, and attempt reinjection after load. If reinjection fails because access was revoked, keep the session paused and ask the user to invoke the extension again.

Do not add `tabs`, `webNavigation`, broad host permissions, or static content scripts without a new documented need and test.

## Privacy constraints

- Capture only trusted click events (`isTrusted === true`).
- Never collect input values, passwords, textarea/select values, contenteditable contents, form contents, page HTML/text, document title, URL query, or URL fragment.
- Do not use arbitrary page text as a fallback label.
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
- Documentation files in PR #2 were read back from GitHub.
- Current branch comparison confirms the feature branch is synchronized with `main`.
- No fresh successful CI run or local test run is claimed for the current branch.

## Immediate next actions

1. Implement the first vertical slice: popup start, permission-safe content-script injection, trusted click descriptors, and draft persistence.
2. Add privacy-focused unit tests before expanding UI.
3. Display steps live in the side panel; implement stop/save/cancel.
4. Add navigation, restricted-page, tab-close, and service-worker restart tests.
5. Verify all checks in CI and update the project map. Keep the PR unmerged until the repository owner explicitly approves.
