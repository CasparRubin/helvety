import { defineConfig, devices } from "@playwright/test";

const smokeBaseUrl = process.env.HELVETY_SMOKE_BASE_URL;

/**
 * Cross-zone smoke tests (gateway + auth redirect). Run locally:
 *   bunx playwright install chromium
 *   bun run ci:check:e2e
 * Or with an existing gateway:
 *   HELVETY_SMOKE_BASE_URL=http://localhost:3001 bun run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: smokeBaseUrl ?? "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
