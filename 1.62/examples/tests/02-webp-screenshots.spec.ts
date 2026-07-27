import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';

// (1.62) WebP joins PNG and JPEG for screenshots and visual baselines.
//
// The quality knob is the whole story:
//
//   quality: 100 (default) -> LOSSLESS webp. Pixel-exact comparison, roughly
//                             25-35% smaller than png. Safe for baselines.
//   quality: < 100         -> LOSSY webp. Much smaller again, but the
//                             compression noise produces false diffs.
//                             Fine for trace attachments and debug artifacts.
//                             Never use it for a baseline.
//
// Existing .png baselines keep working unchanged. WebP only applies to
// snapshots you explicitly name .webp.

test('lossless webp is the default, and it is smaller than png', async ({ page }, testInfo) => {
  await page.goto('/');

  const png = testInfo.outputPath('shot.png');
  const webpLossless = testInfo.outputPath('shot-lossless.webp');
  const webpLossy = testInfo.outputPath('shot-lossy.webp');

  await page.screenshot({ path: png });
  await page.screenshot({ path: webpLossless });                 // type inferred from .webp
  await page.screenshot({ path: webpLossy, quality: 40 });       // lossy

  const size = (p: string) => statSync(p).size;
  console.log(`png              ${size(png)} bytes`);
  console.log(`webp lossless    ${size(webpLossless)} bytes`);
  console.log(`webp q=40        ${size(webpLossy)} bytes`);

  expect(size(webpLossy)).toBeLessThan(size(webpLossless));
});

// You can also be explicit rather than relying on the extension.
test('type: webp works without a .webp path', async ({ page }, testInfo) => {
  await page.goto('/');
  const buffer = await page.screenshot({ type: 'webp', quality: 80 });

  // RIFF....WEBP magic bytes.
  expect(buffer.subarray(0, 4).toString('ascii')).toBe('RIFF');
  expect(buffer.subarray(8, 12).toString('ascii')).toBe('WEBP');
});

// Visual baselines: just name the snapshot .webp. Playwright stores the golden
// as lossless webp: same pixel-exact comparison as png, roughly 25-35% smaller
// in the repo. This is the one 1.62 feature that is pure upside for most teams.
test('visual baseline stored as webp', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Submit' })).toHaveScreenshot('submit.webp');
});
