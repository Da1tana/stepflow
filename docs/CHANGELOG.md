# Project change log

This file is the chronological map of meaningful project changes. It complements Git history: commits contain the exact code, while this file explains the scope and purpose in product terms.

## 2026-11-25

### Browser integration — first recording slice
- Added the minimal `activeTab` and `scripting` permissions and documented their purpose in the manifest validator and README.
- Added popup-driven recording startup and programmatic injection of `src/content/recorder.js` into the active tab.
- Recorder listens only for trusted clicks on a limited allowlist of interactive elements; it never reads field values, form contents, page text, HTML, or selectors.
- Added service-worker handlers that validate extension sender, top-frame/tab identity, and sanitize descriptors again before appending steps.
- Added local persistence for one active draft at `sf.recordingDraft`.
- Added RU/EN startup and error status strings and updated the popup smoke-test expectation.
- This slice does not yet include stop/save/cancel controls, side-panel step rendering, or navigation recovery. Fresh CI is required for this new head.

### Recording core — first implementation slice
- CI initially caught two test expectation issues: long token-like labels are intentionally blanked, and a sensitive button label is retained only as a generic action. Updated tests to assert those privacy behaviors.
- Restricted-page validation is enforced when a recording session is created, with an explicit PDF-path regression test.
- Added `src/core/privacy.js` for allowlisted descriptor sanitization and origin-only URL normalization.
- Added `src/core/step-label.js` for localized Russian/English action labels.
- Added `src/core/restricted-url.js` for browser-internal, store, local-file, malformed, and obvious PDF URL rejection.
- Added `src/core/recording.js` for immutable session state transitions.
- Added four unit-test files covering privacy, labels, URL restrictions, and session transitions.
- This is domain logic only. It does not yet inject scripts, capture real clicks, or persist drafts.

### Foundation merged
- PR [#1](https://github.com/Da1tana/stepflow/pull/1) merged into `main`.
- Delivered the Manifest V3 foundation: popup, side panel, local settings storage, RU/EN localization, message routing, validation, tests, packaging, and CI.

### Recording MVP plan and project continuity
- Added the recording plan and agent-independent project map: `AI_HANDOFF.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, and `DECISIONS.md`.
- Recorded Chrome API findings and the privacy constraints for the upcoming browser integration.

### Branch synchronization and documentation PR
- Synchronized `feat/recording-mvp` with `main` using a normal merge commit; no force-push or history rewrite.
- [PR #2](https://github.com/Da1tana/stepflow/pull/2) remains an open draft. It is not merged.
- Keep `main` unchanged until the repository owner explicitly approves a merge.
