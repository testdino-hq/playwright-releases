import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';

// (1.64) `test.describe.configure({ lock })` applies a test lock to every test
// in a file or describe block.
//
// Background: 1.63 added locks (`test('...', { lock: 'name' }, ...)`). Tests
// that hold the same lock never run at the same time, across files, workers
// and projects. Everything else still runs fully in parallel.
//
// THE PROBLEM 1.64 FIXES
//   In 1.63 every test had to repeat `{ lock: 'shared-inbox' }`. Add a test,
//   forget the option, and you have a flaky race on the shared resource.
//
// THE 1.64 SOLUTION
//   Declare it once for the whole group. New tests inherit it.
//
// Use it for: one shared test account, a singleton settings page, a mailbox,
// a feature flag service, a rate-limited third-party sandbox.
// Do NOT use it to paper over order dependence: that is what --shuffle finds.

const MARKER = 'test-results/shared-inbox.lock-marker';

test.describe('shared inbox', () => {
  // Every test in this block holds the 'shared-inbox' lock.
  test.describe.configure({ lock: 'shared-inbox' });

  // Each test checks that nobody else is inside the critical section, enters
  // it, works for a while, and leaves. Without the lock, fullyParallel runs
  // these on different workers at the same time and the marker check fails.
  for (const name of ['send welcome mail', 'send reset mail', 'clear inbox']) {
    test(name, async () => {
      mkdirSync('test-results', { recursive: true });
      expect(existsSync(MARKER), 'another test is using the shared inbox').toBe(false);
      writeFileSync(MARKER, name);
      await new Promise(resolve => setTimeout(resolve, 300));
      rmSync(MARKER);
    });
  }
});

test('tests outside the block are not locked and run in parallel', async () => {
  expect(true).toBe(true);
});
