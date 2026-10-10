import { test, expect, devices } from '@playwright/test';

// Breaking changes in 1.64 that can turn a green suite red after upgrading.
// Each test shows the new behavior and how to opt out where you can.

test.describe('screen is forwarded from device descriptors', () => {
  // BEFORE: test.use({ ...devices['Pixel 7'] }) set the viewport but dropped
  //         the descriptor's `screen`, so window.screen and `device-width`
  //         media queries reported the wrong size.
  // NOW:    window.screen matches the device. Responsive code that branches on
  //         screen size (not viewport) may take a different path.
  // OPT OUT: test.use({ screen: undefined }).
  const { defaultBrowserType, ...pixel7 } = devices['Pixel 7'];
  test.use(pixel7);

  test('window.screen and device-width match the emulated phone', async ({ page }) => {
    await page.goto('/');
    const screen = await page.evaluate(() => ({ width: window.screen.width, height: window.screen.height }));
    // Pixel 7: viewport 412x839, screen 412x915. Before 1.64 the screen size was lost.
    expect(screen).toEqual({ width: 412, height: 915 });
    expect(await page.evaluate(() => matchMedia('(device-width: 412px)').matches)).toBe(true);
  });
});

test.describe('elements inside hidden iframes are hidden', () => {
  // BEFORE: a button inside a `display: none` iframe could report visible,
  //         so toBeVisible() passed and click() tried to act on it.
  // NOW:    actions, isVisible() and toBeVisible() treat it as hidden, like a
  //         user would. Tests that asserted visibility inside a collapsed
  //         widget's iframe now fail, correctly.
  test('a button in a display:none iframe is not visible', async ({ page }) => {
    await page.goto('/');
    const hidden = page.frameLocator('#hidden-frame').getByRole('button', { name: 'Inside hidden iframe' });
    const visible = page.frameLocator('#visible-frame').getByRole('button', { name: 'Inside visible iframe' });

    await expect(hidden).toBeHidden();
    await expect(visible).toBeVisible();
  });
});

// Two more, with nothing to run here:
//
// JSX in test files follows tsconfig.json. Test files with JSX now compile
// with your tsconfig `jsx` options and default to the automatic runtime
// (react/jsx-runtime). If a test file relied on the classic runtime with an
// implicit `React` import, set "jsx" in tsconfig or import React explicitly.
//
// --update-snapshots=missing now passes. See 09-webp-screenshots-and-missing-snapshots.
