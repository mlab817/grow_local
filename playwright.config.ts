import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm --workspace=server run dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: true,
    },
    {
      command: 'npm --workspace=client run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
});
