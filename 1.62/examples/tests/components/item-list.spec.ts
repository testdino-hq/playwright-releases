import { test, expect } from '@playwright/test';

// Network mocking works exactly as it does in an e2e test, because a component
// test IS an e2e test now. One rule: register routes BEFORE mount(), since
// mount() navigates.
//
// This is a straight upgrade over the experimental packages, where module mocks
// silently did not apply across the Node/browser boundary.

test('renders the loaded state', async ({ page, mount }) => {
  await page.route('**/api/items', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: ['mocked-one', 'mocked-two'] }),
  }));

  const component = await mount('components/ItemList/Default');
  await expect(component.getByRole('listitem')).toHaveText(['mocked-one', 'mocked-two']);
});

test('renders the error state', async ({ page, mount }) => {
  await page.route('**/api/items', route => route.fulfill({ status: 500 }));

  const component = await mount('components/ItemList/Default');
  await expect(component.getByRole('alert')).toContainText('Something went wrong');
});

test('hits the real endpoint when nothing is mocked', async ({ mount }) => {
  const component = await mount('components/ItemList/Default');
  await expect(component.getByRole('listitem')).toHaveText(['alpha', 'beta', 'gamma']);
});
