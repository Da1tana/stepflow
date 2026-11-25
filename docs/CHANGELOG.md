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

### Documentation PR opened
- Opened [PR #2](https://github.com/Da1tana/stepflow/pull/2), draft, targeting `main`.
- PR contains documentation only; no source-code implementation changes.
- GitHub compare: `feat/recording-mvp` is 10 commits ahead and 1 commit behind `main`; the changed-file diff is six documentation files.
- PR #2 reported `mergeable: false` at creation. Branch synchronization remains unresolved and must be handled without force-push.
- Latest combined-status query returned no status entries; no fresh CI pass is claimed.
