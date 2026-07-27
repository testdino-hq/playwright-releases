import { defineConfig, devices } from '@playwright/test';

const BASE = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  // (1.62) Retries no longer interleave with the rest of the run.
  // 'immediate' (default) retries as soon as a worker frees up.
  // 'isolated'  parks every retry until the end, then runs them one by one
  //             in a single worker. A flaky test can no longer poison a
  //             neighbour that happened to share its worker.
  retryStrategy: 'isolated',

  reporter: [
    ['list'],
    // (1.62) `mergeFiles` was a click-every-time toggle in the HTML report UI.
    // It is now a config option, so the grouping survives CI and teammates.
    ['html', { open: 'never', mergeFiles: true }],
    // (1.62) A reporter that filters the run before it starts.
    ['./reporters/quarantine-reporter.ts'],
  ],

  projects: [
    {
      name: 'core',
      testIgnore: /components\//,
      use: { ...devices['Desktop Chrome'], baseURL: BASE, trace: 'on-first-retry' },
    },
    {
      // (1.62) Component testing: a normal e2e project pointed at a gallery page.
      // No @playwright/experimental-ct-* package, no second bundler config.
      name: 'components',
      testDir: './tests/components',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${BASE}/playwright/gallery/index.html`,
        // Keeps the app's own service worker from shadowing page.route() mocks.
        serviceWorkers: 'block',
        // Reuses the browser context across tests in a worker. Component suites
        // are short and numerous, so this is a large speedup.
        reuseContext: true,
      },
    },
  ],

  webServer: {
    command: 'node server.mjs',
    url: BASE,
    reuseExistingServer: !process.env.CI,
  },
});
