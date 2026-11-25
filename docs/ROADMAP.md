# StepFlow roadmap

This roadmap is ordered by product dependencies. A milestone is not complete until its acceptance criteria are met and its implementation is present in the repository.

For the full project map, see [PROJECT_STATUS.md](PROJECT_STATUS.md), [CHANGELOG.md](CHANGELOG.md), and [DECISIONS.md](DECISIONS.md). The AI/developer handoff is in [AI_HANDOFF.md](AI_HANDOFF.md).

## 0. Foundation — complete

Delivered in merged [PR #1](https://github.com/Da1tana/stepflow/pull/1).

- Manifest V3 shell, service worker, popup, and side panel.
- Local settings storage and RU/EN localization.
- Shared messaging/storage utilities and guide domain model.
- Static validation, unit/E2E test infrastructure, packaging, and CI.

## 1. Recording MVP — next

**Goal:** record trusted user clicks and save a useful guide locally. No screenshots in this milestone.

Scope:
- Minimal permissions: `activeTab` and `scripting` in addition to existing permissions.
- Start recording from the popup/action user gesture; side panel provides recording controls and explains how to grant access when needed.
- Inject a recorder only into the active tab after permission is granted.
- Capture safe descriptors for supported interactive elements.
- Generate localized step labels in Russian and English.
- Sanitize descriptors in the content script and validate/sanitize again in the service worker.
- Persist draft state and serialize incoming steps safely.
- Display steps live in the side panel.
- Stop and save a guide; cancel and discard a draft.
- Handle same-origin navigation, cross-origin pause/resume, restricted pages, tab close, and service-worker restart.
- Add unit tests and browser E2E tests, including assertions that typed values and passwords never enter storage.

Acceptance criteria:
- A user can start, perform several supported clicks, see the steps, stop, and find the saved guide after reopening the panel.
- Cancel discards the draft.
- Unsupported/restricted pages fail with a clear user-facing explanation.
- No form values, passwords, page text/HTML, URL query, or URL fragment are stored.
- Unit tests, E2E tests, static validation, and CI pass.
- Documentation accurately describes the implemented behavior and permissions.

Before implementation, resolve the browser API and gesture questions in [DECISIONS.md](DECISIONS.md). The detailed proposal is [plans/recording-mvp.md](plans/recording-mvp.md).

## 2. Screenshot capture

**Goal:** attach a visual reference to each recorded step.

Potential scope:
- Capture the visible tab only after an explicit supported user action.
- Highlight the target element without capturing sensitive values.
- Store image data in IndexedDB; keep only an identifier/reference in guide metadata.
- Define retention, storage limits, and failure behavior.

Acceptance criteria:
- Screenshots are associated with the correct steps.
- Sensitive form content is not intentionally captured; privacy limitations and user controls are documented.
- Storage limits and cleanup behavior are tested.
- CI passes.

This milestone must not begin until the Recording MVP is stable.

## 3. Guide editor

**Goal:** let users refine a recorded guide.

Potential scope:
- Rename a guide and edit step descriptions.
- Reorder and delete steps.
- Review or remove screenshots.
- Persist edits locally.

Acceptance criteria:
- Editing does not corrupt existing guides.
- Empty states, validation, and localization are covered by tests.

## 4. Export

**Goal:** make guides useful outside the extension.

Potential formats:
- HTML.
- Markdown.
- PDF, if it can be supported without compromising the local-first approach.

Acceptance criteria:
- Exported guides preserve step order and available images.
- Export works offline.
- Output is tested with special characters and both supported locales.

## 5. Validate demand and monetization

Do not assume demand is proven by building the extension.

After a usable MVP:
- Put the product in front of target users who create internal procedures, onboarding guides, or support instructions.
- Observe whether they complete a real workflow with it.
- Measure activation, successful guide creation, repeat use, and willingness to pay.
- Interview users about privacy, browser compatibility, and export needs.
- Choose a monetization model only after evidence: free core with paid capabilities, team licensing, or another validated approach.

## Working rules

- Deliver one small milestone at a time.
- Keep the repository as the source of truth and record decisions in docs.
- Work on feature branches; use PRs for review.
- Commit each logical stage and verify CI.
- Never merge into `main` without the repository owner's explicit approval.
- Keep the project portable across AI coding tools.
