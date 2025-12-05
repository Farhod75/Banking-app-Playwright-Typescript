import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-smoke',
      use: {
        ...devices['Desktop Chrome'],
      },
      grep: /@smoke/,
    },
    {
      name: 'chromium-regression',
      use: {
        ...devices['Desktop Chrome'],
      },
      grepInvert: /@smoke/,
    },
    {
      name: 'firefox-regression',
      use: {
        ...devices['Desktop Firefox'],
      },
      grepInvert: /@smoke/,
    },
  ],

  outputDir: 'test-results',
});