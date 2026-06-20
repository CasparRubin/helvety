import { expect, test } from "@playwright/test";

const E2EE_ZONE_PATHS = ["/tasks", "/notes", "/contacts", "/links"] as const;

/**
 * Structural smoke: E2EE zone routes respond. Full edit-flow tests require
 * vault unlock + auth; list/editor sync is covered by unit + wiring tests.
 */
test.describe("E2EE editor wiring smoke", () => {
  for (const path of E2EE_ZONE_PATHS) {
    test(`${path} zone responds`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
