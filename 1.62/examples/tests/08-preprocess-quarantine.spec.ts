import { test, expect } from '@playwright/test';

// Targets for `reporters/quarantine-reporter.ts`.
//
//   npm run quarantine       -> reporter skips one and marks one
//                               expected-to-fail. Suite is green.
//   npm run quarantine:off   -> same suite, filter disabled. Two tests go red.
//
// Nothing in this file knows it is quarantined. That is the point: the
// quarantine list lives in quarantine.json, editable by anyone on call,
// with no code change to the spec and no --grep title convention.

test('healthy test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toContainText('Playwright 1.62');
});

test('known broken until the API ships', async ({ page }) => {
  await page.goto('/');
  // Would hang against a backend that is not deployed yet.
  await expect(page.getByTestId('not-deployed-yet')).toBeVisible({ timeout: 2_000 });
});

test('documented bug, tracked in PROJ-4413', async ({ page }) => {
  await page.goto('/');
  // The app says "Idle"; the spec says it should say "Ready" on load.
  // It is a real bug, so the assertion genuinely fails.
  await expect(page.getByTestId('status')).toHaveText('Ready', { timeout: 2_000 });
});
