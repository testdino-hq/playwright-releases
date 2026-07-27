import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// (1.62) storageState({ credentials: true }) makes WebAuthn passkeys part of
// the saved storage state.
//
// 1.61 gave tests a virtual authenticator, but the credentials died with the
// context, so every passkey test had to re-register a passkey before it could
// sign in. 1.62 lets you register ONCE in a setup project, save the state, and
// have every worker restore it, the same shape as the cookie-based auth-setup
// pattern teams already use.
//
// Two things to internalise:
//  - The saved credentials carry their PRIVATE KEYS. A storage-state file with
//    credentials is a secret: gitignore it, do not attach it to reports.
//  - Restoring such a state auto-installs the virtual authenticator. You do NOT
//    call credentials.install() again in the restoring context.

test('register once, save with credentials, reuse in a fresh context', async ({ browser }, testInfo) => {
  const statePath = testInfo.outputPath('auth-with-passkey.json');

  // --- Setup context: register a passkey a single time. ---
  const setupContext = await browser.newContext();
  await setupContext.credentials.install();

  const setupPage = await setupContext.newPage();
  await setupPage.goto('/passkey.html');
  await setupPage.getByRole('button', { name: 'Register passkey' }).click();
  await expect(setupPage.getByTestId('result')).toHaveText('registered');

  const registered = await setupContext.credentials.get();
  expect(registered.length).toBeGreaterThan(0);
  console.log(`registered ${registered.length} credential(s) for rpId=${registered[0].rpId}`);

  // (1.62) The new option. Without it the passkey is dropped from the state.
  await setupContext.storageState({ path: statePath, credentials: true });
  await setupContext.close();

  // The private key really is in the file, so treat it accordingly.
  const saved = JSON.parse(readFileSync(statePath, 'utf-8'));
  expect(saved.credentials).toHaveLength(1);
  expect(saved.credentials[0]).toHaveProperty('privateKey');

  // --- Fresh context: no registration, straight to sign-in. ---
  const restored = await browser.newContext({ storageState: statePath });
  const page = await restored.newPage();
  await page.goto('/passkey.html');

  // Note: no credentials.install() call. Restoring the state installed the
  // authenticator and re-seeded the passkey for us.
  await page.getByRole('button', { name: 'Sign in with passkey' }).click();
  await expect(page.getByTestId('result')).toHaveText('signed-in');

  await restored.close();
});

test('without credentials:true the passkey is not in the state at all', async ({ browser }, testInfo) => {
  const statePath = testInfo.outputPath('auth-without-passkey.json');

  const setupContext = await browser.newContext();
  await setupContext.credentials.install();
  const setupPage = await setupContext.newPage();
  await setupPage.goto('/passkey.html');
  await setupPage.getByRole('button', { name: 'Register passkey' }).click();
  await expect(setupPage.getByTestId('result')).toHaveText('registered');

  expect(await setupContext.credentials.get()).toHaveLength(1);

  await setupContext.storageState({ path: statePath }); // <- the 1.61 behaviour
  await setupContext.close();

  const saved = JSON.parse(readFileSync(statePath, 'utf-8'));
  expect(saved.credentials ?? []).toHaveLength(0);

  // A context restored from this state has no authenticator installed, so the
  // page falls through to the platform's native WebAuthn, which in a headless
  // browser simply never resolves. That silent hang is exactly why you want
  // credentials: true rather than a re-register step in every test.
  const restored = await browser.newContext({ storageState: statePath });
  expect(await restored.credentials.get()).toHaveLength(0);
  await restored.close();
});

// The production shape: do this once in a setup project, point the rest of the
// suite at the saved file with `use: { storageState: ... }`.
test('seed a credential directly, without driving the UI', async ({ browser }, testInfo) => {
  const statePath = testInfo.outputPath('seeded.json');

  const context = await browser.newContext();
  // create() populates the authenticator; install() is what makes the page see
  // it. Seeding without installing is a silent no-op from the page's view.
  await context.credentials.create('localhost', { residentCredential: true });
  await context.credentials.install();

  expect(await context.credentials.get({ rpId: 'localhost' })).toHaveLength(1);

  await context.storageState({ path: statePath, credentials: true });
  await context.close();

  const restored = await browser.newContext({ storageState: statePath });
  expect(await restored.credentials.get()).toHaveLength(1);
  await restored.close();
});
