import { test, expect } from '@playwright/test';

// (1.62) "page.evaluate() and addInitScript() now accept functions as
// arguments", the shortest line in the release notes and the one that is
// most badly undersold.
//
// It is NOT function-source-transfer. It is an inline, disposable, two-way RPC
// bridge, gated behind one option:
//
//     { exposeFunctions: true }
//
// Any function anywhere in the argument becomes a proxy in the browser. Calling
// it calls BACK into Node. The body runs in Node, keeps its closure, and
// returns a Promise to the browser. It is page.exposeFunction() without the
// global name, without the setup call, and without the teardown.

test('without exposeFunctions, a function argument is still a serialization error', async ({ page }) => {
  await page.goto('/');

  const error = await page
      .evaluate(({ fn }) => fn(), { fn: () => 42 })
      .catch(e => e as Error);

  expect(error.message).toContain('Attempting to serialize unexpected value');
});

test('exposeFunctions turns arguments into callbacks into Node', async ({ page }) => {
  await page.goto('/');

  const seen: number[] = [];

  const result = await page.evaluate(
      async ({ values, double }) => {
        const out: number[] = [];
        // The proxy is ASYNC in the browser even though the Node function is
        // synchronous. This is the one thing to remember: always await it.
        for (const v of values)
          out.push(await double(v));
        return out;
      },
      {
        values: [1, 2, 3],
        double: (n: number) => { seen.push(n); return n * 10; },
      },
      { exposeFunctions: true });

  expect(result).toEqual([10, 20, 30]);
  // Proof the body ran in Node, not in the browser.
  expect(seen).toEqual([1, 2, 3]);
});

test('the function keeps its Node closure', async ({ page }) => {
  await page.goto('/');

  const secret = 'resolved-in-node';
  const result = await page.evaluate(
      ({ reveal }) => reveal(),
      { reveal: () => secret },
      { exposeFunctions: true });

  expect(result).toBe('resolved-in-node');
});

// This is the piece that makes the new component-testing model workable when
// you really do need a spy: an init script that installs a Node-backed logger
// before any app code runs.
test('addInitScript installs a Node-backed callback before app code runs', async ({ page }) => {
  const events: string[] = [];

  await page.addInitScript(
      ({ report }) => {
        window.addEventListener('click', () => void report('clicked'));
      },
      { report: (name: string) => { events.push(name); } },
      { exposeFunctions: true });

  await page.goto('/');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect.poll(() => events).toEqual(['clicked']);
});

// (1.62, and absent from the release notes) addInitScript now returns a
// `Disposable` (`{ dispose(): Promise<void>, [Symbol.asyncDispose]() }`), so
// an init script can be removed again instead of living for the whole context
// lifetime. Previously an init script was permanent once installed.
test('addInitScript returns a Disposable you can remove', async ({ page }) => {
  const stub = await page.addInitScript(() => {
    (globalThis as any).__stubbed = true;
  });

  await page.goto('/');
  expect(await page.evaluate(() => (globalThis as any).__stubbed)).toBe(true);

  await stub.dispose();

  await page.reload();
  expect(await page.evaluate(() => (globalThis as any).__stubbed)).toBeUndefined();
});

// Because it is a Disposable, `await using` scopes an init script to a block:
// no manual teardown, and it is removed even if the assertion throws.
test('scope an init script to a block with `await using`', async ({ page }) => {
  {
    await using _clock = await page.addInitScript(() => {
      Date.now = () => 1_700_000_000_000;
    });

    await page.goto('/');
    expect(await page.evaluate(() => Date.now())).toBe(1_700_000_000_000);
  }

  await page.reload();
  expect(await page.evaluate(() => Date.now())).toBeGreaterThan(1_700_000_000_000);
});
