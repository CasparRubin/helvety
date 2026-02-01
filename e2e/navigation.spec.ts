import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Helvety/i);
  });

  test("should navigate to privacy page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/privacy"]');
    await expect(page).toHaveURL("/privacy");
    await expect(page.locator("h1")).toContainText(/Privacy/i);
  });

  test("should navigate to terms page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/terms"]');
    await expect(page).toHaveURL("/terms");
    await expect(page.locator("h1")).toContainText(/Terms/i);
  });

  test("should navigate to impressum page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/impressum"]');
    await expect(page).toHaveURL("/impressum");
    await expect(page.locator("h1")).toContainText(/Impressum|Legal Notice/i);
  });
});

test.describe("Theme Switching", () => {
  test("should toggle theme", async ({ page }) => {
    await page.goto("/");

    // Find and click theme toggle button
    const themeButton = page.getByRole("button", { name: /toggle theme/i });
    await expect(themeButton).toBeVisible();

    // Get initial theme
    const htmlElement = page.locator("html");
    const initialClass = await htmlElement.getAttribute("class");

    // Click to toggle
    await themeButton.click();

    // Wait for theme change
    await page.waitForTimeout(100);

    // Verify class changed
    const newClass = await htmlElement.getAttribute("class");
    expect(newClass).not.toBe(initialClass);
  });
});

test.describe("Responsive Design", () => {
  test("should show mobile menu on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Mobile menu button should be visible
    const mobileMenuButton = page.getByRole("button", { name: /menu/i });
    await expect(mobileMenuButton).toBeVisible();
  });

  test("should hide mobile menu on large screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Mobile menu button should not be visible
    const mobileMenuButton = page.getByRole("button", { name: /menu/i });
    await expect(mobileMenuButton).not.toBeVisible();
  });
});
