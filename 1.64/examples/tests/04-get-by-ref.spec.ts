import { test, expect } from '@playwright/test';

// (1.64) page.getByRef('e2') locates an element by the aria ref that
// `page.ariaSnapshot({ mode: 'ai' })` prints next to it, like `[ref=e2]`.
//
// THE PROBLEM BEFORE 1.64
//   AI agents (Playwright MCP, playwright-cli, your own) read the page as an
//   aria snapshot and refer to elements by ref. Turning "click e5" back into
//   test code meant guessing a locator from the snapshot text.
//
// THE 1.64 SOLUTION
//   getByRef() resolves the ref directly. `.normalize()` then converts it to
//   the resilient, role-based locator that `codegen` would write, so an agent's
//   choice becomes reviewable, committable test code.
//
// RULE: refs belong to the LATEST snapshot taken in that frame. Take a new
// snapshot after the page changes, then look the ref up again.

test('snapshot, pick a ref, act on it', async ({ page }) => {
  await page.goto('/');

  const snapshot = await page.ariaSnapshot({ mode: 'ai' });
  // Find the ref the snapshot assigned to the "Create account" button.
  const ref = snapshot.match(/button "Create account" \[ref=(e\d+)\]/)?.[1];
  expect(ref, snapshot).toBeTruthy();

  await page.getByLabel('Email').fill('agent@example.com');
  await page.getByRef(ref!).click();
  await expect(page.getByTestId('signup-result')).toHaveText('Welcome, agent@example.com');
});

test('normalize a ref into code you would commit', async ({ page }) => {
  await page.goto('/');

  const snapshot = await page.ariaSnapshot({ mode: 'ai' });
  const ref = snapshot.match(/button "Create account" \[ref=(e\d+)\]/)![1];

  const normalized = await page.getByRef(ref).normalize();
  console.log(`ref ${ref} -> ${normalized.toString()}`);
  expect(normalized.toString()).toBe(`getByRole('button', { name: 'Create account' })`);
});
