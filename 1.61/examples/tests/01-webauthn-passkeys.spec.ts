// tests/01-webauthn-passkeys.spec.ts
// Playwright 1.61 — WebAuthn passkeys via the virtual authenticator.
//
// browserContext.credentials seeds a passkey and answers the WebAuthn
// ceremony in the page, so passkey/passwordless login runs in CI with no
// hardware key, across all browsers.
import { test, expect } from '@playwright/test';
import { generateKeyPairSync, randomBytes } from 'crypto';

// A self-contained passkey login page served from memory, so this demo runs
// anywhere without an external auth provider. It performs a REAL usernameless
// navigator.credentials.get() ceremony that the virtual authenticator answers
// using the passkey we seed below.
const LOGIN_PAGE = `
<!doctype html><html><body>
  <h1 id="status">Signed out</h1>
  <button id="signin">Sign in with a passkey</button>
  <script>
    const enc = new TextEncoder();
    document.getElementById('signin').onclick = async () => {
      const cred = await navigator.credentials.get({ publicKey: {
        challenge: enc.encode('auth-challenge'),
        rpId: location.hostname,
        userVerification: 'discouraged',
      }});
      document.getElementById('status').textContent = cred ? 'Welcome back' : 'Failed';
    };
  </script>
</body></html>`;

// A passkey is an EC P-256 key pair. We export the keys as base64url DER,
// which is exactly what context.credentials.create() expects.
function makePasskey() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return {
    id: randomBytes(16).toString('base64url'),
    userHandle: randomBytes(8).toString('base64url'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64url'),
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64url'),
  };
}

test('user logs in with a registered passkey', async ({ browser }) => {
  const context = await browser.newContext();

  // 1.61: seed a discoverable passkey for the origin under test...
  await context.credentials.create('example.com', makePasskey());
  // ...and arm the virtual authenticator so the page sees it.
  await context.credentials.install();

  const page = await context.newPage();
  await page.route('https://example.com/login', (route) =>
    route.fulfill({ contentType: 'text/html', body: LOGIN_PAGE }),
  );
  await page.goto('https://example.com/login');

  // 1.61: read the passkeys the authenticator now holds — useful when one test
  // registers a credential and a later step asserts it exists.
  const registered = await context.credentials.get();
  expect(registered.length).toBe(1);

  // The login button triggers the real navigator.credentials.get() ceremony
  // and the virtual authenticator answers it with the seeded passkey.
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await expect(page.getByText('Welcome back')).toBeVisible();

  await context.close();
});
