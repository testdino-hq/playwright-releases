import { test, expect } from '@playwright/test';

// Two 1.64 snapshot changes, both configured in playwright.config.ts.
//
// 1) expect.toHaveScreenshot.type: 'webp'
//    1.62 added WebP snapshots, but only when you NAMED the file `x.webp`.
//    Unnamed calls, `toHaveScreenshot()`, always wrote PNG. 1.64 adds a
//    `type` option so unnamed snapshots can be WebP too: smaller baselines
//    in git, same diffing. Default is still 'png'. Named snapshots keep the
//    format of their extension.
//
// 2) updateSnapshots: 'missing' now PASSES (breaking change)
//    Before 1.64, a test that wrote a missing baseline always failed, so the
//    first run of a new visual test was red everywhere, including CI.
//    1.64 splits the modes:
//      'default'  missing baselines are written AND the test fails (old behavior,
//                 still the default, so CI cannot silently "pass" without them)
//      'missing'  missing baselines are written and the test PASSES
//    This folder sets 'missing' so the very first `npm test` is green.
//    Run `npx playwright test 09 --update-snapshots=default` to see the old way.

test('unnamed screenshot is stored as .webp', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('table', { name: 'Orders' })).toHaveScreenshot();

  // The baseline path ends in .webp because of the config option.
  const baseline = testInfo.snapshotPath('unnamed-screenshot-is-stored-as-webp-1.webp', { kind: 'screenshot' });
  console.log(`baseline: ${baseline}`);
});

test('a named snapshot keeps the format of its extension', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('table', { name: 'Orders' })).toHaveScreenshot('orders-table.png');
});
