// tests/03-api-response-network.spec.ts
// Playwright 1.61 — security + address details on API responses.
//
// apiResponse.securityDetails() returns the TLS/security details of the
// response; apiResponse.serverAddr() returns the server IP and port.
import { test, expect, request as apiRequest } from '@playwright/test';

test('inspect TLS and server address of an API response', async () => {
  const request = await apiRequest.newContext();

  // Any HTTPS endpoint exposes these; we hit the demo store's site.
  const response = await request.get('https://storedemo.testdino.com');
  expect(response.ok()).toBeTruthy();

  // 1.61: TLS details — issuer, protocol, validity window.
  const security = await response.securityDetails();
  console.log('securityDetails:', security);
  expect(security?.protocol).toBeTruthy();

  // 1.61: the server IP address and port the response came from.
  const addr = await response.serverAddr();
  console.log('serverAddr:', addr);
  expect(addr?.port).toBeGreaterThan(0);

  await request.dispose();
});
