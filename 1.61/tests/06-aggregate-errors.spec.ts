// tests/06-aggregate-errors.spec.ts
// Playwright 1.61 — testInfo.errors splits an AggregateError.
//
// When a test throws an AggregateError (e.g. several soft assertions failing
// together), testInfo.errors now lists each sub-error separately instead of
// collapsing them into one entry. Reporters see one error per real failure.
import { test, expect } from '@playwright/test';

// This test is EXPECTED to fail — its whole point is to show how 1.61 reports
// the failure. test.fail() asserts it fails, so the suite stays green while the
// afterEach below prints the three split testInfo.errors entries.
test('several soft failures appear as separate testInfo.errors entries', async () => {
  test.fail();
  // Three soft assertions that all fail. They throw together as an
  // AggregateError at the end of the test.
  expect.soft(1, 'first check').toBe(2);
  expect.soft('a', 'second check').toBe('b');
  expect.soft(true, 'third check').toBe(false);
});

test.afterEach(({}, testInfo) => {
  // 1.61: each soft-assertion failure is its own entry here, not one blob.
  console.log(`testInfo.errors count: ${testInfo.errors.length}`);
  for (const error of testInfo.errors) {
    console.log('— error:', error.message?.split('\n')[0]);
  }
});
