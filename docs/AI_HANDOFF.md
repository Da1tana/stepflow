# AI handoff guide

This document is the entry point for any AI assistant or developer continuing StepFlow. The repository is the source of truth; chat history is not.

## Product

StepFlow is a Manifest V3 browser extension that records user actions and turns them into step-by-step guides. The initial product direction is local-first: no backend, no remote code, no paid API dependency in the MVP.

The current milestone is **Recording MVP without screenshots**:
1. The user starts recording from the extension popup (or the configured action shortcut).
2. StepFlow records safe descriptions of trusted user clicks.
3. Steps appear in the side panel.
4. The user stops and saves a guide locally, or cancels the draft.

Screenshots, guide editing, and export are later milestones.

## Read these files first

1. `README.md` — product, setup, checks, and current capabilities.
2. `docs/PROJECT_STATUS.md` — verified implementation status and known gaps.
3. `docs/ROADMAP.md` — milestone sequence and acceptance gates.
4. `docs/CHANGELOG.md` — chronological map of meaningful changes.
5. `docs/DECISIONS.md` — decisions, rationale, and open technical questions.
6. `docs/ARCHITECTURE.md` — architectural boundaries and extension contexts.
7. `docs/plans/recording-mvp.md` — detailed Recording MVP proposal.
8. `manifest.json`, `package.json`, and relevant source/tests before proposing code changes.

Do not assume the plan is already implemented. Check the actual files and current GitHub state.

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
- PR [#2](https://github.com/Da1tana/stepflow/pull/2) is an open draft for documentation and the Recording MVP plan; it is not merged.
- `feat/recording-mvp` contains documentation and the technical plan; the recording implementation is not present yet.
- Latest compare: the feature branch is 10 commits ahead of and 1 commit behind `main` (diverged). Its reported file diff contains documentation only.
- PR #2 reports `mergeable: false`; re-check GitHub's current mergeability and resolve the branch sync through a normal merge/update-branch operation. Never force-push.
- No fresh CI pass is claimed for the documentation commits.

## Definition of done for every implementation stage

1. Code and tests are committed to the intended feature branch.
2. Static validation and relevant unit/E2E tests have run in CI where possible.
3. CI result is checked, not assumed.
4. Changelog/status/decision documentation is updated where appropriate.
5. Working changes are represented in a PR; no unapproved merge.
6. The final report links the commit/PR and clearly states remaining risks.
