# AI handoff guide

This document is the entry point for any AI assistant or developer continuing StepFlow. The repository is the source of truth; chat history is not.

## Product

StepFlow is a Manifest V3 browser extension that records user actions and turns them into step-by-step guides. The initial product direction is local-first: no backend, no remote code, no paid API dependency in the MVP.

The current milestone is **Recording MVP without screenshots**. The feature branch already contains the pure recording core, popup-driven browser integration, local draft persistence, side-panel step display, and guide save/cancel flow. These are implementation facts, not a claim that the entire MVP has passed final verification.

Current implemented flow:
1. The user invokes StepFlow through its popup, granting temporary `activeTab` access to the active tab.
2. The user starts recording; StepFlow injects `src/content/recorder.js` using `chrome.scripting`.
3. The recorder captures trusted clicks on supported interactive elements and sends minimal descriptors.
4. The service worker validates the sender, top frame, active tab and session, sanitizes the descriptor again, and persists the draft under `sf.recordingDraft`.
5. The side panel renders the live steps.
6. Finish/save converts a non-empty draft into a locally stored guide; cancel discards the draft.

Screenshots, navigation recovery, guide editing, and export are not part of the verified current slice.

## Read these files first

1. `README.md` — product, setup, checks, and current capabilities.
2. `docs/PRODUCT_OVERVIEW.ru.md` — product purpose, target users, scenarios, and future scope.
3. `docs/PROJECT_STATUS.md` — implementation status, verification, and known gaps.
4. `docs/ROADMAP.md` — milestone sequence and acceptance gates.
5. `docs/CHANGELOG.md` — chronological map of meaningful changes.
6. `docs/DECISIONS.md` — decisions, rationale, and open technical questions.
7. `docs/ARCHITECTURE.md` — architectural boundaries and extension contexts.
8. `docs/plans/recording-mvp.md` — detailed Recording MVP proposal.
9. `manifest.json`, `package.json`, and relevant source/tests before proposing code changes.

Do not assume a planned feature is implemented. Check the actual files and current GitHub state.

## Git and collaboration rules

- GitHub repository: [Da1tana/stepflow](https://github.com/Da1tana/stepflow).
- `main` is the stable baseline. Never push feature work directly to `main`.
- Continue an existing feature branch when it is the intended active workstream; do not create duplicate branches without a reason.
- Before every task, inspect the repository, current branch, open PRs, recent commits, and compare the feature branch with `main`.
- Keep changes small and reviewable. Commit each completed logical stage with a descriptive message.
- After every meaningful stage, update the relevant project map: changelog, status, roadmap, and/or decision log.
- Open or update a Pull Request for review. **Do not merge a PR unless the repository owner explicitly asks.**
- Never force-push, rewrite history, or delete branches without explicit approval.
- Record important decisions and their rationale in the repository, not only in chat.
- The project must remain portable between AI tools. Do not rely on a single provider's private project format, hidden memory, or chat thread.

## Tool capability honesty

An assistant using the GitHub integration may be able to read and write repository files, create commits, branches, and PRs. That does not imply it can run a local terminal or execute tests itself.

- Never claim a test passed unless its output is available.
- Prefer GitHub Actions CI as the execution environment when local command execution is unavailable.
- Report exactly which checks ran, their result, and any checks that remain unverified.
- If a tool cannot perform an operation, say so and propose the smallest safe alternative. Do not present suggested code as implemented code.

## Product and privacy constraints

- Manifest V3; plain JavaScript, HTML, and CSS; preserve the existing no-build architecture unless a documented decision changes it.
- Local-first storage. Do not introduce a backend or external service into the MVP without an explicit product decision.
- Request the minimum browser permissions required by a feature. Explain each new permission in the manifest, validator allowlist, and documentation.
- Do not collect input values, passwords, textarea/select values, contenteditable content, form contents, page HTML, full page text, URL query strings, or URL fragments.
- Treat page content as untrusted. Accept only trusted user events and validate/sanitize descriptors again in the service worker.
- Store only the minimum safe element description needed to create a useful step.
- Keep English and Russian localization in sync.
- Preserve the existing CSP and avoid inline scripts, `eval`, and remotely hosted executable code.

## Current handoff point

Verified on 2026-11-25:
- PR #1 (foundation) is merged into `main`.
- PR [#2](https://github.com/Da1tana/stepflow/pull/2) is closed and was never merged; it is superseded by draft [PR #3](https://github.com/Da1tana/stepflow/pull/3).
- Active branch: `feat/recording-mvp-recovery`, based on the last complete CI-passing implementation commit. `main` is unchanged; inspect compare before each new task.
- The active recovery branch includes the project map and Recording MVP implementation across the pure core, popup, content recorder, service worker, storage, and side panel.
- Pure core modules: `privacy.js`, `step-label.js`, `restricted-url.js`, and `recording.js`, with unit tests.
- Browser flow implemented: `activeTab` + `scripting`, popup start, content-script injection, trusted-click capture, sender/tab/frame/session checks, second sanitization boundary, local draft persistence, live side-panel display, finish/save, and cancel.
- Remaining before calling Recording MVP verified: dedicated E2E that starts from the real popup user gesture and captures real trusted clicks; tests proving sensitive typed values never reach storage; same-origin navigation reinjection; cross-origin pause/recovery; tab-close and service-worker restart behavior.
- Screenshots, guide editor, and export are later milestones.
- No local terminal execution is available in the current GitHub-only workflow. CI must be checked against the exact latest PR head; an older green run does not verify newer commits.

## Definition of done for every implementation stage

1. Code and tests are committed to the intended feature branch.
2. Static validation and relevant unit/E2E tests have run in CI where possible.
3. CI result is checked, not assumed.
4. Changelog/status/decision documentation is updated where appropriate.
5. Working changes are represented in a PR; no unapproved merge.
6. The final report links the commit/PR and clearly states remaining risks.
