// tests/02-web-storage.spec.ts
// Playwright 1.61 — Web Storage API on page.localStorage / page.sessionStorage.
//
// Read and write the page's storage for the current origin directly, with no
// evaluate() round-trip. Methods are async: getItem, setItem, items,
// removeItem, clear.
import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('read the real auth token the app stored at login', async ({ page }) => {
  // Log in for real — the app persists a JWT in localStorage under
  // `user_access_token`.
  await login(page);

  // 1.61: read it back through the typed API, no evaluate() round-trip.
  const token = await page.localStorage.getItem('user_access_token');
  expect(token).toBeTruthy();
  console.log('user_access_token:', token!.slice(0, 16), '…');

  // Pull the whole bag of items at once — handy for snapshotting a fixture or
  // asserting the login token actually landed.
  const all = await page.localStorage.items();
  console.log('localStorage keys:', all.map((i) => i.name));
  expect(all.some((i) => i.name === 'user_access_token')).toBe(true);
});

test('write, read, and clear storage with the first-class API', async ({ page }) => {
  await page.goto('https://storedemo.testdino.com');

  // Write the way the app would (no evaluate() round-trip).
  await page.localStorage.setItem('consent', 'accepted');
  expect(await page.localStorage.getItem('consent')).toBe('accepted');

  // sessionStorage has the same API.
  await page.sessionStorage.setItem('flow', 'checkout');
  expect(await page.sessionStorage.getItem('flow')).toBe('checkout');

  // Clear storage between steps.
  await page.localStorage.removeItem('consent');
  expect(await page.localStorage.getItem('consent')).toBeNull();
});
