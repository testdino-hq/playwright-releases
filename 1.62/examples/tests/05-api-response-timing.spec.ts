import { test, expect } from '@playwright/test';

// (1.62) apiResponse.timing() returns resource timing for API responses, matching
// what request.timing() has always given browser requests.
//
// Before 1.62 an API test could tell you an endpoint was correct but not that
// it was slow, and "the checkout API got 3x slower" is a regression worth
// failing a build over.

test('timing() breaks a request into phases', async ({ request }) => {
  const response = await request.get('/api/items');
  expect(response.ok()).toBeTruthy();

  const timing = response.timing();
  console.log(JSON.stringify(timing, null, 2));

  // All phase values are relative to startTime, or -1 when unavailable.
  expect(timing.startTime).toBeGreaterThan(0);
  expect(timing.responseEnd).toBeGreaterThanOrEqual(timing.requestStart);
});

test('server think-time is responseStart - requestStart', async ({ request }) => {
  const response = await request.get('/api/items?delay=400');
  const { requestStart, responseStart, responseEnd } = response.timing();

  const serverTime = responseStart - requestStart;
  const downloadTime = responseEnd - responseStart;

  console.log(`server ${serverTime.toFixed(1)}ms | download ${downloadTime.toFixed(1)}ms`);

  // The endpoint sleeps 400ms, and that shows up as time-to-first-byte.
  expect(serverTime).toBeGreaterThan(300);
});

// A performance budget that lives next to the functional assertions, with no
// separate load-testing tool and no separate pipeline.
test('endpoint stays inside its latency budget', async ({ request }) => {
  const response = await request.get('/api/items');
  const { requestStart, responseStart } = response.timing();

  expect(responseStart - requestStart,
      'GET /api/items time-to-first-byte').toBeLessThan(1_000);
});

// Two caveats worth knowing before you build dashboards on this:
//  - For a redirected request you get the LAST hop only, not the chain.
//  - Replaying from a HAR gives you -1 for every field. Guard for it.
test('HAR replay and unavailable phases report -1', async ({ request }) => {
  const timing = (await request.get('/api/items')).timing();

  const unavailable = Object.entries(timing).filter(([, v]) => v === -1);
  console.log('phases reported as unavailable:', unavailable.map(([k]) => k).join(', ') || 'none');

  // Connection reuse legitimately makes DNS/TLS phases -1, so a real budget
  // check should skip -1 rather than treat it as "instant".
  const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
  expect(timing.domainLookupStart === -1 || dnsTime >= 0).toBeTruthy();
});
