import { test, expect, request as playwrightRequest } from '@playwright/test';

// (1.64) APIRequestContext gets addCookies(), cookies() and clearCookies(),
// the same trio BrowserContext has had for years.
//
// THE PROBLEM BEFORE 1.64
//   A standalone API context (`request.newContext()`) had a cookie jar you
//   could not touch. To log out, switch user, or seed a cookie you had to
//   build `Cookie` headers by hand, or round-trip through storageState files.
//
// THE 1.64 SOLUTION
//   Read, add and clear cookies directly, with the familiar filters.
//   For `page.request` and `context.request` these are the same as the
//   browser context's cookie methods, so API calls and the UI share one jar.

test('read the session cookie that a login endpoint set', async ({ baseURL }) => {
  const api = await playwrightRequest.newContext({ baseURL });
  await api.post('/api/login');

  const cookies = await api.cookies();
  expect(cookies.map(c => c.name)).toContain('session');
  console.log(cookies.map(c => `${c.name}=${c.value}`).join('; '));

  await api.dispose();
});

test('seed a cookie without a login call', async ({ baseURL }) => {
  const api = await playwrightRequest.newContext({ baseURL });
  await api.addCookies([{ name: 'feature', value: 'new-checkout', url: baseURL! }]);

  const res = await api.get('/api/whoami');
  expect((await res.json()).cookie).toContain('feature=new-checkout');

  await api.dispose();
});

test('clear one cookie by name to simulate a logout', async ({ baseURL }) => {
  const api = await playwrightRequest.newContext({ baseURL });
  await api.post('/api/login');
  await api.addCookies([{ name: 'theme', value: 'dark', url: baseURL! }]);

  await api.clearCookies({ name: 'session' });

  const names = (await api.cookies()).map(c => c.name);
  expect(names).toEqual(['theme']);
  await api.dispose();
});

test('page.request shares the cookie jar with the browser context', async ({ page, context }) => {
  await page.request.post('/api/login');
  // Same cookie, visible from the browser side.
  expect((await context.cookies()).map(c => c.name)).toContain('session');

  await page.request.clearCookies();
  expect(await context.cookies()).toEqual([]);
});
