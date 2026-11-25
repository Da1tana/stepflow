# StepFlow test map

Last verified: 2026-11-25
Branch: `feat/recording-mvp-recovery`
Latest fully passing CI at the time of writing: [run #59](https://github.com/Da1tana/stepflow/actions/runs/45602679182).

This file is the acceptance-test inventory. A feature is not considered verified merely because its implementation or a mocked unit test exists.

## Automated coverage currently in the repository

| Area | Test location / scenario | Level | Status |
|---|---|---|---|
| Privacy descriptor allowlist and redaction | `tests/unit/privacy.test.mjs` | Unit | Covered |
| Input-like roles never retain labels | `tests/unit/privacy.test.mjs` | Unit | Covered |
| Safe origin removes path/query/fragment/credentials | `tests/unit/privacy.test.mjs` | Unit | Covered |
| Restricted URL classification | `tests/unit/restricted-url.test.mjs` | Unit | Covered |
| Localized step labels | `tests/unit/step-label.test.mjs` | Unit | Covered |
| Recording session transitions | `tests/unit/recording.test.mjs` | Unit | Covered |
| Guide conversion from recording | `tests/unit/guide-recording.test.mjs` | Unit | Covered |
| Navigation loading pauses active draft | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Covered |
| Successful reinjection resumes draft | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Covered |
| Denied reinjection preserves paused draft | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Covered |
| Tab close preserves captured steps | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Covered |
| Unrelated tabs do not affect recording | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Covered |
| Manifest, permissions, paths and i18n validation | `scripts/validate.mjs` in CI | Static validation | Covered |
| Popup render and state | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Covered |
| Side panel render, settings persistence | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Covered |
| Side panel displays a controlled draft and saves/cancels it | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Covered |
| Guide list updates from storage and renders titles as text | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Covered |
| Service worker responds to app message | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Covered |
| English and Russian UI smoke tests | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Covered |

## Outstanding acceptance tests

| Priority | Scenario | Required proof | Status |
|---|---|---|---|
| P0 | Start recording from the real browser-action popup on an ordinary web tab | Popup user gesture grants temporary access; service worker injects recorder into the intended active tab | Not covered |
| P0 | Capture a real trusted click | A real page click creates exactly one safe step in the active draft | Not covered |
| P0 | Sensitive inputs are never persisted | Type unique canary values into text, email, password and textarea controls; click supported controls; inspect all relevant local storage and guide data for canaries | Not covered |
| P0 | Content-script privacy boundary | Confirm captured descriptor contains only allowed role/label fields and no value, selector, text, HTML or URL | Partially covered by code review and unit tests; no browser assertion |
| P1 | Same-origin navigation | Navigate within same origin; draft pauses, recorder is reinjected, recording resumes once | Unit behavior covered; real Chromium E2E not covered |
| P1 | Cross-origin navigation | Navigate to another origin; reinjection denial leaves draft paused and preserves existing steps | Mocked denial covered; real Chromium E2E not covered |
| P1 | Recorded tab closes | Draft remains paused and can still be saved/discarded | Mocked unit covered; real Chromium E2E not covered |
| P1 | Service worker terminates/restarts | Draft survives worker termination; UI and lifecycle handlers recover without duplicate listeners or lost steps | Not covered |
| P1 | Fast loading/complete event race | Serialized lifecycle transitions produce final recording state deterministically | Mocked unit covered; browser stress test not covered |
| P2 | Restricted page start | Clear failure, no draft left behind, no unhandled errors | Partially covered by URL unit tests; browser E2E not covered |

## CI test map

The latest fully passing run #59 executed these steps successfully:

1. `npm ci`
2. Manifest, permission, path and i18n validation
3. Unit tests
4. Chromium installation
5. Clean extension package build
6. Chromium E2E suite
7. Screenshot and extension artifact uploads

No local commands were run by the assistant. The CI result is the evidence for the listed run only; new commits require a new CI run.

## Acceptance gate for Recording MVP

Do not mark Recording MVP complete until all P0 tests pass in Chromium and the P1 lifecycle scenarios have browser-level coverage or an explicitly documented, accepted limitation. CI must be green on the exact PR head being reviewed.
