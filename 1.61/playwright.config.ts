// playwright.config.ts
// Playwright 1.61 demo config — showcases the new video retention modes.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // 1.61: one retry so 'retain-on-failure-and-retries' has something to retain.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // 1.61 NEW video mode: keep the footage of the failing run AND every retry,
    // and nothing for runs that simply passed.
    video: 'retain-on-failure-and-retries',
    trace: 'on-first-retry',
    // WebSocket frames now show up in HAR + trace (1.61).
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
