# StepFlow decision log

Record decisions that affect product scope, architecture, privacy, or delivery. Add new entries at the top with date, status, decision, rationale, and consequences. Revisit a decision only by adding a new entry; do not silently erase its history.

## 2026-11-25 — Keep GitHub as the source of truth

**Status:** adopted

**Decision:** All meaningful code, plans, decisions, progress, and handoff instructions must be committed to this repository. AI chat history is supplementary, not authoritative.

**Rationale:** Development must continue if access to Claude or any other AI provider is interrupted.

**Consequences:** Maintain this log, `CHANGELOG.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, and `AI_HANDOFF.md`. Use small commits and reviewable PRs.

## 2026-11-25 — Feature work stays on feature branches

**Status:** adopted

**Decision:** Do not push feature work directly to `main`; use the existing active feature branch when it is the intended workstream. The repository owner controls PR merges.

**Rationale:** Keep the stable baseline protected and make every stage reviewable.

**Consequences:** No force-push, history rewrite, branch deletion, or PR merge without explicit approval.

## 2026-11-25 — Recording MVP excludes screenshots

**Status:** proposed in the technical plan; implementation not started

**Decision:** First deliver reliable click recording and local guide saving. Screenshot capture is a later milestone.

**Rationale:** Reduce scope and validate the core workflow before adding image capture and its privacy/storage complexity.

**Consequences:** Recording MVP acceptance criteria must not require screenshots.

## 2026-11-25 — Local-first MVP

**Status:** adopted as current product direction

**Decision:** Keep user data local in the browser extension; no backend, remote code, or paid API dependency in the MVP.

**Rationale:** Minimize operating cost, complexity, and privacy exposure while validating demand.

**Consequences:** Prefer `chrome.storage.local` for small structured state and evaluate IndexedDB for larger binary data in a later milestone.

## Open technical questions — resolve before implementation

1. **Navigation listeners and permissions:** Verify in the target Chromium versions which `chrome.tabs` events can be used without the `tabs` permission, and which tab fields are actually available. Do not add `tabs` permission merely by assumption.
2. **User-gesture propagation:** Verify that opening the side panel and starting injection can both be performed reliably from the popup's direct click flow. Call gesture-restricted APIs directly in the user-gesture handler where required.
3. **Cross-origin recovery:** Confirm the exact re-grant flow after `activeTab` access is revoked.
4. **Privacy labels:** Validate that accessible names and labels cannot leak sensitive content; do not assume regex redaction makes arbitrary page text safe.
5. **Browser compatibility:** Define and test the supported Chromium baseline before claiming compatibility.

These are verification gates, not permission to broaden the manifest or relax privacy constraints.
