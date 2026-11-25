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

### Branch state after documentation commits
- `feat/recording-mvp` is 4 commits ahead of and 1 commit behind `main` according to GitHub compare.
- The ahead changes are the recording plan and project documentation; compare reports no source-code changes.
- Branch synchronization is still pending. No force-push or history rewrite was performed.
- No fresh CI/test result is claimed for these documentation commits.
