import { test, expect } from '@playwright/test';

// (1.64) locator.within(parent) scopes a locator inside every element `parent`
// matches, and resolves nth() / first() / last() separately inside EACH parent.
//
// THE PROBLEM BEFORE 1.64
//   `rows.getByRole('cell').nth(2)` means "the 3rd cell in the whole table",
//   not "the 3rd cell of each row". To assert a column you had to loop over
//   rows, or write a CSS/XPath selector like `tr > td:nth-child(3)` that breaks
//   the moment the markup changes. Issue #42842 asked for exactly this.
//
// THE 1.64 SOLUTION
//   page.getByRole('cell').nth(2).within(page.getByRole('row'))
//   reads as: "the 3rd cell, within each row". One locator, one assertion,
//   still user-facing roles. The docs now recommend within() for combining
//   locators.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('assert a whole table column in one line', async ({ page }) => {
  const table = page.getByRole('table', { name: 'Orders' });
  const rows = table.getByRole('row').filter({ has: page.getByRole('cell') });

  // Column 3 (index 2) of every body row.
  const items = page.getByRole('cell').nth(2).within(rows);
  await expect(items).toHaveText(['Apple', 'Banana', 'Cherry']);
});

test('the old chaining picks ONE cell from the whole table, not a column', async ({ page }) => {
  const rows = page.getByRole('table', { name: 'Orders' })
      .getByRole('row').filter({ has: page.getByRole('cell') });

  // Pre-1.64 habit: nth() applies to the flattened list of all cells.
  const oneCell = rows.getByRole('cell').nth(2);
  await expect(oneCell).toHaveCount(1);
  await expect(oneCell).toHaveText('Apple');

  // within(): nth() applies per row, so you get one match per row.
  const column = page.getByRole('cell').nth(2).within(rows);
  await expect(column).toHaveCount(3);
});

test('first() per parent: act on a button in a specific row', async ({ page }) => {
  const graceRow = page.getByRole('row').filter({ hasText: 'Grace' });

  await page.getByRole('button', { name: 'Refund' }).first().within(graceRow).click();
  await expect(page.getByRole('status', { name: 'Last refund' })).toHaveText('#1002');
});
