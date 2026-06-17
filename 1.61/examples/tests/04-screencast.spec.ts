// tests/04-screencast.spec.ts
// Playwright 1.61 — screencast cursor decoration + onFrame timestamp.
//
// screencast.showActions() gains a `cursor` option so the pointer is clearer
// in the recorded video; screencast.start()'s onFrame callback now receives a
// timestamp per frame.
import { test, expect } from '@playwright/test';

// A small self-contained page so the recorded flow is deterministic and the
// cursor decoration always lands on real, clickable targets.
const DEMO_PAGE = `
<!doctype html><html><body style="font-family:sans-serif;padding:40px">
  <h1>Screencast demo</h1>
  <button data-testid="add-to-cart-button" style="padding:12px 20px;font-size:18px">Add to cart</button>
  <button data-testid="cart-button" style="padding:12px 20px;font-size:18px;margin-left:12px">Open cart</button>
  <p id="log"></p>
  <script>
    const log = document.getElementById('log');
    for (const b of document.querySelectorAll('button'))
      b.onclick = () => log.textContent = 'clicked ' + b.dataset.testid;
  </script>
</body></html>`;

test('record a flow with a clearer cursor', async ({ page }) => {
  let frameCount = 0;
  let firstTimestamp: number | undefined;

  await page.screencast.start({
    path: 'artifacts/checkout.webm',
    onFrame: (frame) => {
      // 1.61: frame.timestamp lets you align frames to test steps.
      frameCount++;
      if (frameCount === 1) {
        firstTimestamp = frame.timestamp;
        console.log('first frame at', frame.timestamp, 'ms');
      }
    },
  });

  await page.setContent(DEMO_PAGE);

  // 1.61: decorate the pointer so actions are obvious in the captured video.
  await page.screencast.showActions({ cursor: 'pointer' });

  // Drive a real flow: the cursor decoration highlights each click.
  await page.getByTestId('add-to-cart-button').click();
  await page.getByTestId('cart-button').click();
  await expect(page.locator('#log')).toHaveText('clicked cart-button');

  await page.screencast.stop();

  console.log('captured frames:', frameCount);
  expect(frameCount).toBeGreaterThan(0);
  expect(typeof firstTimestamp).toBe('number');
});
