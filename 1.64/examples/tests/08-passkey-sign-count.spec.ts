import { test, expect } from '@playwright/test';

// (1.64) credentials.create(rpId, { signCount }) sets the starting signature
// counter of a virtual passkey, and storage state now saves and restores it.
//
// THE PROBLEM BEFORE 1.64
//   Every seeded passkey started at counter 0. A real relying party remembers
//   the last counter it saw and rejects an assertion whose counter did not go
//   up (a cloned-authenticator signal). So re-seeding a captured passkey
//   against a real backend failed the second time, and you could not test the
//   "counter went backwards" branch at all.
//
// THE 1.64 SOLUTION
//   Seed the counter the server already saw. The first assertion reports
//   signCount + 1, then it keeps incrementing.

test('a seeded passkey continues from the counter the server expects', async ({ context, page }) => {
  await context.credentials.create('localhost', { signCount: 41 });
  await context.credentials.install();

  await page.goto('/passkey.html');
  await page.getByRole('button', { name: 'Sign in with passkey' }).click();
  await expect(page.getByTestId('result')).toHaveText('signed-in');
  await expect(page.getByTestId('sign-count')).toHaveText('42');

  await page.getByRole('button', { name: 'Sign in with passkey' }).click();
  await expect(page.getByTestId('sign-count')).toHaveText('43');
});

test('the counter survives a storage state round trip', async ({ browser }, testInfo) => {
  const statePath = testInfo.outputPath('passkey-state.json');

  const first = await browser.newContext();
  await first.credentials.create('localhost', { signCount: 7 });
  await first.credentials.install();
  const page = await first.newPage();
  await page.goto('/passkey.html');
  await page.getByRole('button', { name: 'Sign in with passkey' }).click();
  await expect(page.getByTestId('sign-count')).toHaveText('8');

  await first.storageState({ path: statePath, credentials: true });
  await first.close();

  // Restored context picks up at 8, so the next assertion reports 9, not 1.
  const second = await browser.newContext({ storageState: statePath });
  const again = await second.newPage();
  await again.goto('/passkey.html');
  await again.getByRole('button', { name: 'Sign in with passkey' }).click();
  await expect(again.getByTestId('sign-count')).toHaveText('9');
  await second.close();
});
