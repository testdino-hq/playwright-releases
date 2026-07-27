import { test, expect } from '@playwright/test';

// (1.62) locator.waitForFunction(fn) waits until `fn(element)` returns truthy.
//
// Why it exists: page.waitForFunction() has always been the escape hatch for
// "wait for a condition no assertion covers". But it hands you no element: you
// re-query inside the browser with querySelector, and that query goes stale the
// moment the framework re-renders.
//
// locator.waitForFunction re-RESOLVES the locator on every retry, then calls
// your function with the matching element. Re-renders are tolerated for free.

test('wait for an attribute that no built-in assertion covers', async ({ page }) => {
  await page.goto('/');

  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();

  // The page adds aria-expanded 250ms later.
  await menu.waitForFunction(element => element.hasAttribute('aria-expanded'));

  await expect(menu).toHaveAttribute('aria-expanded', 'true');
});

test('pass an argument to the page function', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Submit' }).click();

  await page.getByTestId('status').waitForFunction(
      (element, value) => element.textContent === value,
      'Ready');
});

// Where it earns its keep: conditions that live on the element but not in the
// DOM: computed style, layout box, scroll position, media state, canvas
// contents. No assertion exists for these, and page.waitForFunction would
// force you to re-select the element yourself.
test('wait on computed layout, not markup', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('status').waitForFunction(element => {
    const { width } = element.getBoundingClientRect();
    return width > 0 && getComputedStyle(element).visibility === 'visible';
  });
});

// Note the return type: Promise<void>, not a JSHandle. This is a wait, not an
// evaluate. If you want the value, follow up with locator.evaluate().
test('it returns void, so chain evaluate() when you need the value', async ({ page }) => {
  await page.goto('/');
  const status = page.getByTestId('status');

  const result = await status.waitForFunction(element => element.textContent!.length > 0);
  expect(result).toBeUndefined();

  const text = await status.evaluate(element => element.textContent);
  expect(text).toBe('Idle');
});
