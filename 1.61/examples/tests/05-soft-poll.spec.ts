// tests/05-soft-poll.spec.ts
// Playwright 1.61 — expect.soft.poll().
//
// expect.poll() retries a value until it matches; expect.soft() records a
// failure without stopping the test. 1.61 combines them: poll a value and, if
// it never matches, log a soft failure and let the test keep running.
import { test, expect } from '@playwright/test';
import { STORE, login, addFirstProductToCart } from './helpers';

test('soft-poll a value until it matches, without aborting', async () => {
  let count = 0;

  // Polls until the value crosses 0. Because it's the *soft* variant, even a
  // miss would not abort the test.
  await expect.soft
    .poll(async () => {
      count++;
      return count;
    })
    .toBeGreaterThan(0);

  // The test continues and can assert other things even if the poll above had
  // failed — that's the point of the soft variant.
  expect(count).toBeGreaterThan(0);
});

test('soft-poll the cart count after adding a product', async ({ page }) => {
  await login(page);
  await addFirstProductToCart(page);

  // The cart badge may take a moment to reflect the added item. Poll the
  // visible count, but don't abort the test if it lags.
  await expect.soft
    .poll(
      async () => {
        const text = await page
          .getByTestId('header-cart-count')
          .textContent()
          .catch(() => '0');
        return Number(text?.match(/\d+/)?.[0] ?? 0);
      },
      { timeout: 5000 },
    )
    .toBeGreaterThan(0);

  // Reached regardless of whether the soft poll matched.
  console.log('test continued past the soft poll');
});
