import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("getValidatedWebEnv", () => {
  it("uses CI placeholders in development without requiring gateway URLs", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.STORE_URL;

    const { getValidatedWebEnv } = await import("./env");
    const env = getValidatedWebEnv();

    expect(env.STORE_URL).toMatch(/^https:\/\//);
    expect(env.OCR_URL).toMatch(/^https:\/\//);
  });

  it("validates real gateway URLs in production when set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("STORE_URL", "https://helvety-store.vercel.app");
    vi.stubEnv("PDF_URL", "https://helvety-pdf.vercel.app");
    vi.stubEnv("IMAGE_EDITOR_URL", "https://helvety-image-editor.vercel.app");
    vi.stubEnv("OCR_URL", "https://helvety-ocr.vercel.app");

    const { getValidatedGatewayEnv } =
      await import("@helvety/shared/env-validation");
    expect(getValidatedGatewayEnv().STORE_URL).toBe(
      "https://helvety-store.vercel.app"
    );
  });
});
