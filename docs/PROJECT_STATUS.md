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
- Latest comparison before this status refresh: **13 commits ahead, 1 commit behind** `main` (diverged).
- The feature branch diff contains documentation only: the recording plan and project map. No source-code implementation changes are reported.
- Synchronization with `main` is pending. No force-push or history rewrite has been performed.
- PR #2 currently reports `mergeable: false`; GitHub may still be calculating mergeability or there may be a conflict. Re-check before any merge/update action.

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

## Recording MVP plan

The detailed technical draft is in [plans/recording-mvp.md](plans/recording-mvp.md). It proposes:

- Add only `activeTab` and `scripting` for the MVP; do not add broad host permissions, `tabs`, `webNavigation`, or static content scripts without a documented need.
- Start recording from a popup/action user gesture, not from a side-panel click alone.
- Pause when navigation leaves the granted origin and require the user to grant access again.
- Capture only trusted click events and safe element descriptors.
- Never collect form values, passwords, page HTML/text, document title, URL query, or URL fragment.
- Persist session state in extension storage so service-worker suspension does not lose it.
- Support one active recording session and the main frame only.

**Important:** the plan is not implementation approval. Before coding, verify Chrome API details for tab lifecycle events without the `tabs` permission, user-gesture requirements for `sidePanel.open`, and the exact re-grant flow. Open questions are tracked in [DECISIONS.md](DECISIONS.md).

## Project map / source of truth

- [AI_HANDOFF.md](AI_HANDOFF.md) — instructions for any AI/developer continuing the project.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — this verified status.
- [ROADMAP.md](ROADMAP.md) — milestone sequence and acceptance criteria.
- [CHANGELOG.md](CHANGELOG.md) — chronological record of meaningful changes.
- [DECISIONS.md](DECISIONS.md) — decisions, rationale, and unresolved technical questions.
- [plans/recording-mvp.md](plans/recording-mvp.md) — detailed recording proposal.
- [ARCHITECTURE.md](ARCHITECTURE.md) — current architecture.

## Existing checks and verification

The merged PR #1 description reports that the foundation's validation, unit tests (3/3), and E2E tests (12/12) passed at the time of that PR. This is historical evidence for the foundation PR, not a fresh run against the current feature branch.

All documentation files in PR #2 were read back from GitHub. The GitHub combined-status query for the latest documentation commit returned no status entries. No fresh local test run or successful CI run is claimed.

## Immediate next actions

1. Resolve PR #2's reported non-mergeable state and synchronize `feat/recording-mvp` with the latest `main` using a normal merge/update-branch operation; never force-push.
2. Verify the open technical questions in [DECISIONS.md](DECISIONS.md) against official Chromium documentation and a reproducible test.
3. Review and finalize the recording plan against the actual foundation code.
4. Implement a small vertical slice: permission-safe start, trusted click capture, validated step persistence, and visible step list.
5. Add unit and E2E coverage with privacy assertions.
6. Verify CI, update this status and changelog, and keep the work in a reviewable PR. Do not merge without the repository owner's approval.
