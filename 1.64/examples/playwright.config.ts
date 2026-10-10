import { defineConfig, devices } from '@playwright/test';

const BASE = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  // (1.64) 'missing' now writes absent baselines AND passes the test, so the
  // first run of a new visual test is green. The default, now called
  // 'default', still fails it. See 09-webp-screenshots-and-missing-snapshots.
  updateSnapshots: 'missing',

  expect: {
    // (1.64) Unnamed `toHaveScreenshot()` baselines are stored as WebP.
    // Before, only snapshots named `*.webp` could be WebP. Default: 'png'.
    toHaveScreenshot: { type: 'webp' },
  },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // (1.64) Prints config.filteredProjects: the projects THIS run selected.
    ['./reporters/selected-projects-reporter.ts'],
  ],

  use: { baseURL: BASE, trace: 'on-first-retry' },

  projects: [
    {
      name: 'core',
      testIgnore: /\.webmcp\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // WebMCP sits behind a Chromium feature flag. Scope it to one project so
      // the rest of the suite runs on a stock browser.
      name: 'webmcp',
      testMatch: /\.webmcp\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--enable-features=WebMCP'] },
      },
    },
    {
      // (1.64) `default: false` keeps a project out of a plain `npx playwright test`.
      // It runs only when named: `--project=order-dependent` or `--project="*"`.
      //
      // Before 1.64 the workarounds were an env var around the whole project
      // entry, or remembering to pass `--project=core --project=webmcp` every
      // time. These specs FAIL on purpose under some seeds, so they must not
      // run by default. See tests-order-dependent/ and `npm run shuffle:demo`.
      name: 'order-dependent',
      testDir: './tests-order-dependent',
      default: false,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'node server.mjs',
    url: BASE,
    reuseExistingServer: !process.env.CI,
  },
});
