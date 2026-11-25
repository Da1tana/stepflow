# StepFlow test map

Last verified: 2026-11-25
Branch: `feat/recording-mvp-recovery`
Latest implementation HEAD: `527f5ec4f92cf635e81c5addf4040e08fc6b1bdd`.
Latest fully passing CI baseline: [run #90](https://github.com/Da1tana/stepflow/actions/runs/45605218843). Native-popup privacy and navigation lifecycle Chromium E2E scenarios are added; [run #100](https://github.com/Da1tana/stepflow/actions/runs/45606025821) was still running on the preceding implementation head when this map was updated. The new HEAD requires its own CI run.

This is the acceptance-test inventory. Implementation or mocked unit coverage alone does not prove real browser behavior.

## Automated coverage on the verified HEAD

| Area | Test location / scenario | Level | Status |
|---|---|---|---|
| Guide conversion from stopped recording | `tests/unit/guide-recording.test.mjs` | Unit | Passed |
| Privacy descriptor allowlist, redaction and malformed input | `tests/unit/privacy.test.mjs` | Unit | Passed |
| Password-role canary is not persisted in a recording step | `tests/unit/recording.test.mjs` | Unit | Passed |
| Restricted URL classification | `tests/unit/restricted-url.test.mjs` | Unit | Passed |
| Localized step labels | `tests/unit/step-label.test.mjs` | Unit | Passed |
| Recording session creation and state transitions | `tests/unit/recording.test.mjs` | Unit | Passed |
| Recorder ignores untrusted clicks | `tests/unit/recorder.test.mjs` | Unit with fake DOM | Passed |
| Recorder does not read input values, text, or HTML | `tests/unit/recorder.test.mjs` | Unit with fake DOM | Passed |
| Recorder supports only allowlisted interactive roles and explicit metadata | `tests/unit/recorder.test.mjs` | Unit with fake DOM | Passed |
| Navigation loading pauses the active draft | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Passed |
| Successful reinjection resumes recording | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Passed |
| Denied reinjection preserves paused draft | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Passed |
| Tab closure preserves captured steps | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Passed |
| Unrelated tabs do not affect recording | `tests/unit/recording-lifecycle.test.mjs` | Unit with mocked Chrome APIs | Passed |
| Manifest, permissions, paths and i18n | `scripts/validate.mjs` in CI | Static validation | Passed |
| Native browser-action popup opens and starts recording on a local HTTP page | `tests/e2e/extension.e2e.mjs` + `openActionPopup()` in `tests/e2e/harness.mjs` | Chromium E2E | Added; CI pending on latest HEAD |
| Real trusted clicks on text, email, password, textarea and safe button are recorded | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Added; CI #96 pending |
| Typed-value canaries absent from draft and saved-guide storage | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Added; CI #96 pending |
| Same-origin navigation pauses, reinjects recorder, resumes once, then captures a trusted click | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Added; CI pending on latest HEAD |\n| Cross-origin navigation leaves draft paused and preserves prior steps after reinjection is denied | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Added; CI pending on latest HEAD |\n| Popup and side-panel smoke flows in English and Russian | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Passed |
| Side-panel draft display, save and cancel | `tests/e2e/extension.e2e.mjs` | Chromium E2E with controlled storage fixture | Passed |
| Guide list rendering and title-as-text safety | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Passed |
| Recorded tab closure preserves draft paused | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Passed |
| Draft persists across forced service-worker target termination and wake-up | `tests/e2e/extension.e2e.mjs` + CDP helper in `tests/e2e/harness.mjs` | Chromium E2E | Passed |
| Extension messaging and storage initialization | `tests/e2e/extension.e2e.mjs` | Chromium E2E | Passed |

## Latest CI evidence

Baseline run #90: [GitHub Actions](https://github.com/Da1tana/stepflow/actions/runs/45605218843), exact HEAD `e8ff75977a2afdfb4c7c84195dbf75e09beab075`.

- `npm ci`: passed.
- Static validation: passed.
- Unit tests: **26/26 passed**.
- Chromium installation: passed.
- Clean extension package build: passed.
- Chromium E2E: **18/18 passed** (9 English + 9 Russian).
- Screenshot and extension artifact uploads: passed.

No local commands were run; verification was performed by GitHub Actions.

## Outstanding acceptance tests

| Priority | Scenario | Required proof | Status |
|---|---|---|---|
| P0 | Start recording through the actual browser-action popup on a normal web page | Real browser action popup user gesture grants temporary access and starts capture on the intended active tab | Added; CI pending on latest HEAD |
| P0 | Capture a real trusted page click | Real page click creates exactly one safe step in the active draft | Added; CI #96 pending |
| P0 | Typed-value privacy canaries | Type unique canaries into text, email, password and textarea controls; inspect draft and saved guide storage for every canary | Added; CI #96 pending. Unit tests also prove the recorder does not read values. |
| P0 | Browser-level content-script privacy boundary | Confirm real content-script message contains only allowed role/label fields and no value, selector, page text, HTML or sensitive URL data | Not covered end-to-end; fake-DOM unit coverage exists |
| P1 | Same-origin navigation recovery | Navigate within the same origin; draft pauses, recorder is reinjected, recording resumes exactly once | Added; CI pending on latest HEAD |
| P1 | Cross-origin navigation denial | Navigate to another origin; denied reinjection leaves draft paused and preserves captured steps | Added; CI pending on latest HEAD |
| P1 | Fast loading/complete race | Browser stress test proves deterministic lifecycle state under rapid events | Serialized mocked unit coverage passed; browser stress test not covered |
| P2 | Restricted page start | Clear user-facing failure, no draft left behind, no unhandled errors | URL classification unit coverage passed; browser E2E not covered |

## Recording MVP acceptance gate

Do not mark Recording MVP complete until all P0 tests pass in Chromium and P1 lifecycle scenarios have browser-level coverage or an explicitly accepted limitation. CI must be green on the exact PR head under review.

