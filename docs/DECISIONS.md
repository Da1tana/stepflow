# StepFlow decision log

Record decisions that affect product scope, architecture, privacy, or delivery. Add new entries at the top with date, status, decision, rationale, and consequences. Revisit a decision only by adding a new entry; do not silently erase its history.

## 2026-11-25 — Chrome API review for Recording MVP

**Status:** documented direction; E2E confirmation still required

**Decision:**
- Keep the permission set minimal: add `activeTab` and `scripting` to the existing `sidePanel` and `storage` permissions when the recording implementation is introduced.
- The user invokes StepFlow by opening its popup (toolbar action or configured shortcut); Chrome documents popup invocation as an `activeTab`-granting action.
- Start script injection from the popup flow. Open the side panel with `chrome.sidePanel.open()` directly in the popup's user-click handler, not after an asynchronous round trip to the service worker.
- Use `chrome.tabs.onUpdated` and `chrome.tabs.onRemoved` for lifecycle observation without adding the `tabs` permission. Avoid reading sensitive tab properties unless the active-tab host grant makes them available.
- On navigation, pause recording while the document loads. After load, attempt reinjection. Same-origin access should remain available; a failed injection after cross-origin navigation leaves the recording paused until the user invokes StepFlow again.
- Do not add `webNavigation`, broad host permissions, or static content scripts for this MVP.

**Rationale:** Chrome's API reference states that most Tabs API operations need no permission; the `tabs` permission primarily unlocks sensitive tab properties (`url`, `pendingUrl`, `title`, `favIconUrl`). The `activeTab` grant supplies temporary host access to the invoked tab. Chrome's Side Panel API requires `open()` to follow a user interaction.

**Consequences / validation required:**
- Use tab ID and non-sensitive loading status for lifecycle events; do not depend on a globally readable URL.
- E2E tests must prove same-origin reinjection succeeds and cross-origin reinjection fails safely.
- The popup must call `sidePanel.open()` directly from a real click handler; test this in Chromium.
- These docs establish a technical direction, not a claim that recording is implemented or that every browser edge case has been tested.

**Official references:**
- [activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
- [Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)

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
