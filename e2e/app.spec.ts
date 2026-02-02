import { test, expect } from "@playwright/test";

test.describe("PDF App", () => {
  test("should load the main page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Helvety/i);
  });

  test("should show theme toggle button", async ({ page }) => {
    await page.goto("/");

    const themeButton = page.getByRole("button", { name: /toggle theme/i });
    await expect(themeButton).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should adapt to mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should still be functional on mobile
    await expect(page).toHaveTitle(/Helvety/i);
  });

  test("should adapt to tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page).toHaveTitle(/Helvety/i);
  });
});
