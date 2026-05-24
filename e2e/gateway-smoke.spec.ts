import { expect, test } from "@playwright/test";

test.describe("gateway smoke", () => {
  test("home responds", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("store rewrite responds", async ({ page }) => {
    const response = await page.goto("/store");
    expect(response?.ok()).toBeTruthy();
  });
});
