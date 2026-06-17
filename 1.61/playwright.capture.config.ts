// playwright.capture.config.ts
// One-off config that forces video + trace ON for every test, so the HTML
// report and Trace Viewer have rich visuals to screenshot. Use:
//   npx playwright test -c playwright.capture.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    video: 'on',
    trace: 'on',
    screenshot: 'on',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium' }],
});
