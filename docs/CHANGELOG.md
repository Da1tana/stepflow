# Project change log

This file is the chronological map of meaningful project changes. It complements Git history: commits contain the exact code, while this file explains the scope and purpose in product terms.

## 2026-11-25

### Foundation merged
- PR [#1](https://github.com/Da1tana/stepflow/pull/1) merged into `main`.
- Delivered the Manifest V3 foundation: popup, side panel, local settings storage, RU/EN localization, message routing, validation, tests, packaging, and CI.
- Recording, screenshots, editor, and export are not part of the merged foundation.

### Recording MVP plan added
- Added `docs/plans/recording-mvp.md` on `feat/recording-mvp`.
- Defined a first recording milestone without screenshots, using `activeTab` + `scripting`, trusted click descriptors, local persistence, and explicit privacy limits.
- This is a plan only; no recording implementation is implied.

### Project continuity documentation added
- Added `docs/AI_HANDOFF.md`: agent-independent handoff and Git workflow rules.
- Added `docs/PROJECT_STATUS.md`: verified baseline, gaps, and next actions.
- Added `docs/ROADMAP.md`: milestone sequence and acceptance criteria.
- Added `docs/CHANGELOG.md`: this chronological map.
- Added `docs/DECISIONS.md`: decisions and open technical questions.
- Updated the recording plan with explicit API, user-gesture, and privacy verification gates.

### Branch synchronization and technical review
- Synchronized `feat/recording-mvp` with the merged `main` baseline using a normal two-parent merge commit: [64b3134](https://github.com/Da1tana/stepflow/commit/64b31342924f5a3779f727143f259e8ddbe13ddd).
- GitHub compare now reports 16 commits ahead and 0 behind; the diff remains the same six documentation files.
- No source code was changed and no PR was merged.
- Reviewed official Chrome documentation for `activeTab`, `tabs`, and `sidePanel.open()`. Key findings are recorded in `DECISIONS.md`.
- No fresh CI pass is claimed; the PR-triggered workflow query returned no runs for the sync commit.

### Documentation PR
- [PR #2](https://github.com/Da1tana/stepflow/pull/2) remains an open draft targeting `main`.
- PR contains documentation only; no source-code implementation changes.
- The feature branch is synchronized with `main`, and the PR is mergeable according to the latest GitHub PR metadata.
- The PR is intentionally not merged. The repository owner controls that decision.
