import { test, expect } from '@playwright/test';

// (1.64) page.webmcp and frame.webmcp list and call the tools a page registers
// for AI agents through the experimental WebMCP browser API
// (document.modelContext.registerTool()).
//
// THE PROBLEM BEFORE 1.64
//   A page's agent tools are a public API: name, description, input schema,
//   behavior. Rename one or let its schema drift and every agent that uses the
//   site breaks, with no visible UI change for a click-based test to catch.
//   Testing them meant page.evaluate() against an experimental browser API.
//
// THE 1.64 SOLUTION
//   tools()            -> [{ name, description, inputSchema, annotations }]
//   callTool(n, input) -> whatever the tool's execute() returns
//   Playwright MCP also offers these tools to agents as `webmcp_<tool>`
//   (opt out with --no-webmcp), and playwright-cli gets `webmcp-list` and
//   `webmcp-call`.
//
// SETUP: Chromium only, behind `--enable-features=WebMCP`. This file runs in
// the `webmcp` project in playwright.config.ts, which adds that flag. The
// page must be a secure origin (https or localhost).
//
// Tool names, descriptions and results come from the page: treat them as
// untrusted input in anything that feeds them to a model.

test.beforeEach(async ({ page }) => {
  await page.goto('/shop.html');
});

test('lock down the tool contract agents depend on', async ({ page }) => {
  const tools = await page.webmcp.tools();

  expect(tools.map(t => t.name).sort()).toEqual(['add_to_cart', 'search_catalog']);

  // Agents choose tools by description, so a vague one is a real bug.
  for (const tool of tools)
    expect(tool.description.length, `${tool.name} needs a useful description`).toBeGreaterThan(30);

  const search = tools.find(t => t.name === 'search_catalog')!;
  expect(search.inputSchema).toMatchObject({ required: ['query'] });
  // `readOnlyHint` in the page is reported as `readOnly`.
  expect(search.annotations).toMatchObject({ readOnly: true });
});

test('call a read-only tool and check its answer', async ({ page }) => {
  const result = await page.webmcp.callTool('search_catalog', { query: 'box' });
  const products = JSON.parse(result.content[0].text);
  expect(products).toEqual([{ sku: 'CAT-001', title: 'Cardboard box, $5' }]);
});

test('call a tool, then assert the UI the user sees', async ({ page }) => {
  // The strongest WebMCP test: act like an agent, verify like a user.
  const result = await page.webmcp.callTool('add_to_cart', { sku: 'CAT-002', quantity: 2 });
  expect(result.content[0].text).toBe('Added 2 x CAT-002');

  await expect(page.getByRole('status', { name: 'Cart' })).toHaveText('2 items');
});

test('a tool that throws surfaces as a rejected callTool()', async ({ page }) => {
  // Worth knowing: Chromium does not pass the tool's own error message through.
  // `throw new Error('Unknown SKU DOG-999')` arrives as a generic
  // "Tool was executed but the invocation failed". Assert on the rejection,
  // then check the UI or a returned error payload for the details.
  await expect(page.webmcp.callTool('add_to_cart', { sku: 'DOG-999' })).rejects.toThrow(/invocation failed/);
  await expect(page.webmcp.callTool('does_not_exist')).rejects.toThrow(/No WebMCP tool named/);
});
