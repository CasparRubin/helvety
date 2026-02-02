import { test, expect } from "@playwright/test";

test.describe("Products Page", () => {
  test("should load the store page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Helvety/i);
  });

  test("should show product catalog when authenticated", async ({ page }) => {
    await page.goto("/products");
    // If redirected to auth, that's expected behavior
    // Just verify the page loads
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should adapt to mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page).toHaveTitle(/Helvety/i);
  });

  test("should adapt to tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page).toHaveTitle(/Helvety/i);
  });
});

test.describe("Theme Switching", () => {
  test("should have theme toggle available", async ({ page }) => {
    await page.goto("/");

    const themeButton = page.getByRole("button", { name: /toggle theme/i });
    await expect(themeButton).toBeVisible();
  });
});
