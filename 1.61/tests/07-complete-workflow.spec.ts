// tests/07-complete-workflow.spec.ts
// Playwright 1.61 — the complete worked example from the blog, wired to the
// REAL storedemo.testdino.com flow with real selectors.
//
// Ties several 1.61 features together: a clearer recorded cursor (screencast),
// the Web Storage API (page.localStorage), a real login + order, and a soft
// poll that records a diagnostic without aborting the run.
import { test, expect } from '@playwright/test';
import { STORE, DEMO_USER, DEMO_PASS } from './helpers';

// 1.61 video mode: keep the failing run and every retry, nothing for passes.
test.use({ video: 'retain-on-failure-and-retries' });

test('login, token check, order, and soft-polled count', async ({ page }) => {
  // 1. Log in through the real login page.
  await page.goto(`${STORE}/login`);
  // 1.61: a clearer cursor in the recorded video.
  await page.screencast.showActions({ cursor: 'pointer' });
  await page.getByTestId('login-email-input').fill(DEMO_USER);
  await page.getByTestId('login-password-input').fill(DEMO_PASS);
  await page.getByTestId('login-submit-button').click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15000 });

  // 2. Read the token the app stored at login — no evaluate() round-trip (1.61).
  const token = await page.localStorage.getItem('user_access_token');
  expect(token).toBeTruthy();
  console.log('user_access_token present:', token!.slice(0, 12), '…');

  // 3. Add a product and walk the real checkout all the way to placing an order.
  await page.goto(`${STORE}/products`);
  await page.getByTestId('all-products-cart-button').first().click();

  // 4. Soft-poll the cart count; a miss is logged, not fatal (1.61). Even if it
  //    lagged, the test would continue and the soft failure would land as its
  //    own testInfo.errors entry.
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

  // 5. Drive the real checkout flow with the clearer recorded cursor.
  await page.getByTestId('header-cart-icon').click();
  await page.getByTestId('checkout-button').click();
  await expect(page.getByTestId('checkout-title')).toBeVisible();
  await page.getByTestId('checkout-cod-button').click();
  await page.getByTestId('checkout-place-order-button').click();

  console.log('workflow finished; token read + full checkout exercised');
});
