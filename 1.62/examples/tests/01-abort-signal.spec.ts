import { test, expect } from '@playwright/test';

// (1.62) `signal` is an AbortSignal option on ~177 methods: actions, navigations,
// waits, and web-first assertions.
//
// The thing to understand: a signal is NOT a second timeout. Timeouts answer
// "how long may this one call take?". A signal answers "is this call still
// worth making?". The answer can come from somewhere else entirely:
// another promise settling, a user cancelling, a global deadline expiring.

test('a signal cancels an action that would otherwise wait out its timeout', async ({ page }) => {
  await page.goto('/');

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 500);

  const started = Date.now();
  // This locator never matches, so the click would normally block for the full
  // 30s action timeout. The signal cuts it at 500ms.
  const click = page.getByRole('button', { name: 'Does not exist' })
      .click({ signal: controller.signal });

  await expect(click).rejects.toThrow();
  const elapsed = Date.now() - started;

  console.log(`aborted after ${elapsed}ms (default timeout would have been 30000ms)`);
  expect(elapsed).toBeLessThan(5_000);
});

test('assertions take a signal too', async ({ page }) => {
  await page.goto('/');

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 500);

  await expect(
      expect(page.getByText('Never appears')).toBeVisible({ signal: controller.signal })
  ).rejects.toThrow();
});

// The pattern that actually pays for itself: race a happy path against an
// error path and cancel the loser, instead of letting it burn its timeout.
test('race two outcomes and cancel the loser', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Submit' }).click();

  const controller = new AbortController();
  const signal = controller.signal;

  const success = expect(page.getByTestId('status')).toHaveText('Ready', { signal });
  const failure = expect(page.getByRole('alert')).toBeVisible({ signal });

  // Whichever settles first wins; the other is cancelled immediately rather
  // than sitting there until the expect timeout expires.
  const winner = await Promise.any([
    success.then(() => 'ready' as const),
    failure.then(() => 'error' as const),
  ]);
  controller.abort();

  expect(winner).toBe('ready');
});

// Worth knowing: a signal does NOT replace the timeout. Both are live, and
// whichever fires first wins. Pass `timeout: 0` if the signal should be the
// only thing that can stop the call.
test('signal and timeout coexist, so pass timeout:0 to let the signal own it', async ({ page }) => {
  await page.goto('/');

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 700);

  const started = Date.now();
  await expect(
      page.getByRole('button', { name: 'Nope' })
          .click({ signal: controller.signal, timeout: 0 })
  ).rejects.toThrow();

  expect(Date.now() - started).toBeLessThan(5_000);
});
