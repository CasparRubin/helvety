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

  test("pdf public tool rewrite responds", async ({ page }) => {
    const response = await page.goto("/pdf");
    expect(response?.ok()).toBeTruthy();
  });

  test("image-editor public tool rewrite responds", async ({ page }) => {
    const response = await page.goto("/image-editor");
    expect(response?.ok()).toBeTruthy();
  });

  test("ocr public tool rewrite responds", async ({ page }) => {
    const response = await page.goto("/ocr");
    expect(response?.ok()).toBeTruthy();
  });
});
