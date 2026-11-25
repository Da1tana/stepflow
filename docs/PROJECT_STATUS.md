# StepFlow — project status

Last verified: 2026-11-25

## Product summary

StepFlow is a local-first Manifest V3 browser extension intended to record browser actions and turn them into step-by-step instructions with screenshots. The current repository version is the foundation; the recording feature is the next implementation milestone.

## Repository state

- Repository: [Da1tana/stepflow](https://github.com/Da1tana/stepflow)
- Default branch: `main`
- Foundation PR: [#1 — Фундамент расширения StepFlow на Manifest V3](https://github.com/Da1tana/stepflow/pull/1) — merged.
- Active recording plan branch: `feat/recording-mvp`.
- The feature branch currently contains the recording plan and handoff documentation work; it does not yet contain the Recording MVP implementation.
- At the last comparison, `feat/recording-mvp` was **diverged** from `main`: one commit ahead and one behind. The ahead commit adds `docs/plans/recording-mvp.md`; the behind commit is the foundation merge commit now on `main`. Reconcile the branch before substantial implementation. Do not force-push.

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

Screenshots, guide editor, and export are also not implemented.

## Recording MVP plan

The detailed plan is in [plans/recording-mvp.md](plans/recording-mvp.md). Its key constraints are:

- Add only `activeTab` and `scripting` for the MVP; do not add broad host permissions, `tabs`, `webNavigation`, or static content scripts.
- Start recording from the popup/action gesture, not from a side-panel click alone.
- Pause when navigation leaves the granted origin and require the user to grant access again.
- Capture only trusted click events and safe element descriptors.
- Never collect form values, passwords, page HTML/text, document title, URL query, or URL fragment.
- Persist session state in extension storage so service-worker suspension does not lose it.
- Support one active recording session and the main frame only.

The plan is a technical plan, not evidence that these behaviors have been implemented or tested in the current product.

## Existing checks and verification

The merged PR #1 description reports that the foundation's validation, unit tests (3/3), and E2E tests (12/12) passed at the time of that PR. This is historical evidence for the foundation PR, not a fresh run against the current feature branch.

No new test run is claimed by this status document. Check the latest GitHub Actions run before relying on CI status.

## Immediate next actions

1. Safely reconcile `feat/recording-mvp` with the latest `main`.
2. Review the recording plan against the actual foundation code and update it if necessary.
3. Implement the smallest vertical slice: permission-safe start, trusted click capture, validated step persistence, and visible step list.
4. Add unit and E2E coverage with privacy assertions.
5. Verify CI and update this status document before opening/updating the PR.
