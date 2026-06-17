// tests/helpers.ts
// Shared helpers for the live storedemo.testdino.com demos.
import { Page, expect } from '@playwright/test';

export const STORE = 'https://storedemo.testdino.com';
export const DEMO_USER = 'siddharth.alphabin@gmail.com';
export const DEMO_PASS = '123456';

// Real login flow against the demo store. After this resolves, the app has
// stored its JWT in localStorage under `user_access_token`.
export async function login(page: Page) {
  await page.goto(`${STORE}/login`);
  await page.getByTestId('login-email-input').fill(DEMO_USER);
  await page.getByTestId('login-password-input').fill(DEMO_PASS);
  await page.getByTestId('login-submit-button').click();
  // The submit redirects away from /login once auth succeeds.
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15000 });
}

// Add the first listed product to the cart from the All Products page.
export async function addFirstProductToCart(page: Page) {
  await page.goto(`${STORE}/products`);
  await page.getByTestId('all-products-cart-button').first().click();
}
