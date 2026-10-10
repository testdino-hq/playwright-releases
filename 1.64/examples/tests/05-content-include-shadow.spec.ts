import { test, expect } from '@playwright/test';

// (1.64) page.content({ includeShadow: true }) serializes open shadow roots as
// declarative shadow DOM: <template shadowrootmode="open"> inside the host.
//
// THE PROBLEM BEFORE 1.64
//   page.content() returned light DOM only. On a web-component app (Lit,
//   Stencil, Shoelace, Salesforce LWC) the saved HTML had empty custom
//   elements, so HTML snapshots, SEO checks and "save the page for the bug
//   report" all lost the actual content.
//
// THE 1.64 SOLUTION
//   One option. The output is valid HTML that re-renders the shadow content
//   when loaded with setContent() or opened in a browser.
//   Closed shadow roots are never included. Default stays `false`.

test('default content() misses what is inside the shadow root', async ({ page }) => {
  await page.goto('/');
  const html = await page.content();
  expect(html).toContain('<price-tag amount="19.99"></price-tag>');
  expect(html).not.toContain('$19.99');
});

test('includeShadow: true keeps it, as declarative shadow DOM', async ({ page }) => {
  await page.goto('/');
  const html = await page.content({ includeShadow: true });
  expect(html).toContain('<template shadowrootmode="open">');
  expect(html).toContain('$19.99');
});

test('the serialized HTML renders the shadow content again', async ({ page, browser }) => {
  await page.goto('/');
  const html = await page.content({ includeShadow: true });

  // Load the saved HTML into a page with no scripts. The custom element is
  // never defined there, yet the price shows, because the template carries it.
  const replay = await browser.newPage({ javaScriptEnabled: false });
  await replay.setContent(html);
  await expect(replay.getByText('$19.99')).toBeVisible();
  await replay.close();
});
