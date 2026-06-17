# Playwright 1.61 — Runnable Demos for Blog Screenshots

Every Playwright 1.61 feature from the blog, as a **real, passing** test against
the actual `@playwright/test@1.61.0` APIs. 8 of the demos exercise the new APIs
directly; live-store demos run against `https://storedemo.testdino.com`.

## Setup (already done)

```bash
npm install
npx playwright install chromium
```

## Run everything

```bash
npm test                 # all specs, list + HTML reporter
npx playwright show-report   # open the HTML report
```

## Per-feature specs (one screenshot per file)

| # | Spec | 1.61 feature | npm script |
|---|------|--------------|------------|
| 01 | `tests/01-webauthn-passkeys.spec.ts` | `browserContext.credentials` virtual authenticator (passkey login, no hardware) | `npm run webauthn` |
| 02 | `tests/02-web-storage.spec.ts` | `page.localStorage` / `page.sessionStorage` Web Storage API | `npm run storage` |
| 03 | `tests/03-api-response-network.spec.ts` | `apiResponse.securityDetails()` + `apiResponse.serverAddr()` | `npm run network` |
| 04 | `tests/04-screencast.spec.ts` | `screencast.showActions({ cursor })` + `onFrame` timestamp | `npm run screencast` |
| 05 | `tests/05-soft-poll.spec.ts` | `expect.soft.poll()` | `npm run soft-poll` |
| 06 | `tests/06-aggregate-errors.spec.ts` | `testInfo.errors` splits an `AggregateError` (expected-fail demo) | `npm run errors` |
| 07 | `tests/07-complete-workflow.spec.ts` | All of the above, end-to-end on the live store | `npm run complete` |

Plus `playwright.config.ts` shows the new **video retention modes**
(`retain-on-failure-and-retries`).

## Screenshot guide

There are three kinds of screenshot you can take, depending on what the blog
section needs:

### A. The code (source)
Open any `tests/*.spec.ts` or `playwright.config.ts` in VS Code and screenshot
the editor. Each file is self-contained and commented with the `(1.61)` marker
on the new lines.

### B. The passing terminal run
```bash
npm run network      # prints real TLS securityDetails + serverAddr
npm run storage      # prints the real user_access_token + localStorage keys
npm run screencast   # prints "first frame at … ms" + captured frame count
npm run errors       # prints the 3 split testInfo.errors entries
```
Screenshot the terminal — the `console.log` output is the proof the API ran.

### C. The HTML report / trace / video
```bash
npm test
npx playwright show-report
```
- The **report** shows pass/fail per spec.
- Open the **trace** of `07-complete-workflow` to screenshot WebSocket traffic
  now captured in the trace (1.61) and the recorded video.
- `tests/artifacts/checkout.webm` (from the screencast spec) shows the
  decorated cursor.

## Notes

- Login for the live-store demos uses the provided demo account; see
  `tests/helpers.ts`.
- Spec 06 is intentionally a failing demo wrapped in `test.fail()`, so the suite
  stays green while still showing the per-error split in its `afterEach` output.
- The demo store's order API may reject the final COD order (backend 401); the
  workflow drives the full real checkout regardless, which is what the 1.61
  features demonstrate.
