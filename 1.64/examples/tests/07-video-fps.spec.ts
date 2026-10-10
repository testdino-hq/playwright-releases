import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';

// (1.64) Test videos get a frame rate option, CSS-styled action decorations,
// and VP9 encoding.
//
// THE PROBLEM BEFORE 1.64
//   Videos were fixed at a low frame rate, so scrolling and animations looked
//   choppy, and the action highlight had one look (only fontSize was
//   configurable). Fine for debugging, not good enough for a bug report a PM
//   watches, or a demo you post.
//
// THE 1.64 SOLUTION
//   fps:   any frame rate, for example 60. Default 25. Firefox and WebKit cap
//          at 25. Higher fps and size cost CPU while encoding.
//   style: plain CSS for three decorations
//            point     - a zero-size marker centred on the click point
//            highlight - a box sized to the target element
//            title     - the action label ("click getByRole(...)")
//          `fontSize` is deprecated: use `style.title: 'font-size: 32px'`.
//   VP9:   smaller files at the same quality, cheaper to encode than VP8.
//   The cursor now stays on screen at the last action point and glides along
//   an eased path, so a viewer can follow what happened.

test.use({
  video: {
    mode: 'on',
    size: { width: 1280, height: 720 },
    fps: 60,
    show: {
      actions: {
        duration: 800,
        position: 'top',
        style: {
          point: 'width: 18px; height: 18px; border-radius: 50%; background: rgba(46, 173, 51, .8)',
          highlight: 'outline: 3px solid #2ead33; background: rgba(46, 173, 51, .12)',
          title: 'font-size: 20px; background: #1b1f23; color: white; padding: 6px 10px; border-radius: 6px',
        },
      },
      test: { level: 'step', position: 'bottom-right' },
    },
  },
});

test('record a 60 fps, styled walkthrough of the sign up flow', async ({ page }, testInfo) => {
  await test.step('open the app', async () => {
    await page.goto('/');
  });

  await test.step('fill the form', async () => {
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByRole('button', { name: 'Create account' }).click();
  });

  await test.step('see the result', async () => {
    await expect(page.getByTestId('signup-result')).toHaveText('Welcome, demo@example.com');
  });

  // The video is finalized when the page closes. Check it exists and is not
  // empty; open it from the HTML report (`npm run report`) to watch it.
  await page.close();
  const path = await page.video()!.path();
  expect(statSync(path).size).toBeGreaterThan(0);
  console.log(`video: ${path} (${testInfo.project.name})`);
});
