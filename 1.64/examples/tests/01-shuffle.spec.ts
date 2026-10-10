import { test, expect } from '@playwright/test';

// (1.64) `npx playwright test --shuffle [seed]` runs test files, and tests in
// fullyParallel mode, in a random order.
//
// This is the most requested feature in the release. It closes three issues
// going back to 2021: #7040, #9297 and #12512 (all "run tests in random order").
//
// THE PROBLEM BEFORE 1.64
//   Playwright always ran files in the same order. A test that only passes
//   because another test ran first (leaked DB rows, a shared account, a cached
//   cookie) passes forever locally, then fails the day you shard CI or run the
//   file alone. Teams wrote custom sequencers or renamed files to catch this.
//
// THE 1.64 SOLUTION
//   --shuffle            random order, new seed every run
//   --shuffle=1234       replay the exact order of a previous run
//   The seed is printed in the "Running N tests" line and stored in
//   config.metadata.shuffleSeed, so CI logs and reports carry it.
//
// WHAT DOES NOT MOVE
//   Serial suites (`test.describe.configure({ mode: 'serial' })`), project
//   dependencies and setup/teardown ordering stay fixed. Shuffle only reorders
//   independent work, which is exactly the work that should not care.
//
// TRY IT
//   npm run shuffle:demo:ordered  tests-order-dependent/ in file order: passes
//   npm run shuffle:demo          the same two files with --shuffle=42: FAILS,
//                                 exposing b-edit-user's hidden dependency on
//                                 a-create-user. Same seed, same order, every time.
//   npm run shuffle               shuffles this whole suite (it should pass:
//                                 every spec here is order-independent)
//
// GOTCHA (#43156)
//   `--shuffle` takes an optional value, so `--shuffle tests/foo.spec.ts`
//   reads the path as the seed. Write `--shuffle=<seed>`, or put `--shuffle`
//   last on the command line.

test('the seed is available to reporters and fixtures via config metadata', async ({}, testInfo) => {
  const seed = testInfo.config.metadata.shuffleSeed;
  if (seed === undefined) {
    console.log('not shuffled. Run `npm run shuffle` to see a seed here.');
    return;
  }
  console.log(`shuffled with seed ${seed}. Replay with --shuffle=${seed}`);
  expect(String(seed)).toMatch(/^\d+$/);
});

// A shuffle-safe test owns its data: it creates what it needs and does not
// read anything another test wrote. Order then cannot matter.
test('a shuffle-safe test creates its own state', async ({ page }) => {
  await page.goto('/');
  const email = `user-${test.info().testId}@example.com`;
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByTestId('signup-result')).toHaveText(`Welcome, ${email}`);
});
