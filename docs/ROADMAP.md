# StepFlow roadmap

This roadmap is ordered by product dependencies. A milestone is not complete until its acceptance criteria are met and its implementation is present in the repository.

For the product purpose and target users, see [PRODUCT_OVERVIEW.ru.md](PRODUCT_OVERVIEW.ru.md). For the full project map, see [PROJECT_STATUS.md](PROJECT_STATUS.md), [CHANGELOG.md](CHANGELOG.md), and [DECISIONS.md](DECISIONS.md). The AI/developer handoff is in [AI_HANDOFF.md](AI_HANDOFF.md).

## 0. Foundation — complete

Delivered in merged [PR #1](https://github.com/Da1tana/stepflow/pull/1).

- Manifest V3 shell, service worker, popup, and side panel.
- Local settings storage and RU/EN localization.
- Shared messaging/storage utilities and guide domain model.
- Static validation, unit/E2E test infrastructure, packaging, and CI.

## 1. Recording MVP — in progress

**Goal:** record trusted user clicks and save a useful guide locally. No screenshots in this milestone.

### 1A. Pure recording core — implemented on feature branch

- Privacy-safe element descriptor sanitizer and origin-only URL handling.
- Localized Russian/English step-title generation.
- Restricted URL classifier.
- Immutable recording session state transitions.
- Unit tests for all four core modules.

### 1B. Browser integration — first slice implemented on feature branch

- Added only the required `activeTab` and `scripting` permissions, with reasons in manifest, validator, and README.
- Popup starts recording after explicit user invocation.
- Recorder is injected only into the active tab.
- Trusted clicks on supported interactive elements are captured.
- Descriptors are validated/sanitized again in the service worker.
- A single draft and safe steps are persisted locally.
- Side panel displays steps live.
- Finish/save converts a non-empty stopped recording into a local guide; guide and draft updates are persisted together.
- Cancel discards the current draft without creating a guide.
- Implemented lifecycle response: pause on navigation loading, attempt recorder reinjection after completion, resume only after successful injection, and retain a paused draft when access is denied.
- Tab closure preserves the draft in a paused state so already captured steps remain saveable.
- Unit tests cover lifecycle transitions with mocked Chrome APIs. Remaining: real Chromium E2E for same-origin reinjection, cross-origin pause, tab close, and service-worker restart.
- E2E now covers side-panel display, save and cancel using a controlled draft fixture. Remaining: real popup-started trusted click capture and assertions that typed values/passwords never enter storage.

### Acceptance criteria

- A user can start, perform several supported clicks, see the steps, stop, and find the saved guide after reopening the panel.
- Cancel discards the draft.
- Unsupported/restricted pages fail with a clear user-facing explanation.
- No form values, passwords, page text/HTML, URL query, or URL fragment are stored.
- Unit tests, E2E tests, static validation, and CI pass.
- Documentation accurately describes the implemented behavior and permissions.

## 2. Screenshot capture

**Goal:** attach a visual reference to each recorded step.

Potential scope:
- Capture the visible tab only after an explicit supported user action.
- Highlight the target element without capturing sensitive values.
- Store image data in IndexedDB; keep only an identifier/reference in guide metadata.
- Define retention, storage limits, and failure behavior.

This milestone must not begin until the Recording MVP is stable.

## 3. Guide editor

**Goal:** let users refine a recorded guide.

Potential scope:
- Rename a guide and edit step descriptions.
- Reorder and delete steps.
- Review or remove screenshots.
- Persist edits locally.

## 4. Export

**Goal:** make guides useful outside the extension.

Potential formats: HTML, Markdown, and PDF if it can be supported without compromising local-first operation.

## 5. Validate demand and monetization

Do not assume demand is proven by building the extension. After a usable MVP, test it with target users who create internal procedures, onboarding guides, or support instructions. Measure activation, successful guide creation, repeat use, and willingness to pay before choosing a pricing model.

## Working rules

- Deliver one small milestone at a time.
- Keep the repository as the source of truth and record decisions in docs.
- Work on feature branches; use PRs for review.
- Commit each logical stage and verify CI.
- Never merge into `main` without the repository owner's explicit approval.
- Keep the project portable across AI coding tools.
