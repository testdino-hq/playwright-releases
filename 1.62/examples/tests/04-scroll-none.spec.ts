import { test, expect } from '@playwright/test';

// (1.62) `scroll: 'auto' | 'none'` on every action.
//
// Playwright has always scrolled an element into view before acting on it.
// That is right for testing behaviour and wrong for testing reachability:
// a "Buy now" button 1500px below the fold passes every click test you write,
// and no test can tell you the user never sees it.
//
// scroll: 'none' makes the action fail unless the element is ALREADY in the
// viewport. That turns a layout regression into a test failure.

test('scroll: auto (the default) reaches anything on the page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Far away button' }).click();
});

test('scroll: none fails when the element is below the fold', async ({ page }) => {
  await page.goto('/');

  const far = page.getByRole('button', { name: 'Far away button' });
  const error = await far.click({ scroll: 'none', timeout: 3_000 }).catch(e => e as Error);

  expect(error).toBeInstanceOf(Error);
  console.log('below-the-fold click rejected as expected');
});

test('scroll: none passes for an element above the fold', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Submit' }).click({ scroll: 'none' });
});

// The practical use: one above-the-fold assertion per critical CTA, run at the
// viewport sizes you actually care about. It is cheaper and far more stable
// than a full-page visual diff for catching "the CTA moved off screen on
// mobile" regressions.
test.describe('CTA stays above the fold', () => {
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'laptop', width: 1280, height: 720 },
  ]) {
    test(viewport.name, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.getByRole('button', { name: 'Submit' })
          .click({ scroll: 'none', trial: true });
    });
  }
});
