import { HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS } from "@helvety/shared/analytics-guardrails";
import { DEV_PORTS } from "@helvety/shared/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

/** Shape of individual rewrite entries used in assertions. */
type RewriteRule = {
  source: string;
  destination: string;
  has?: Array<{
    type: string;
    key?: string;
    value?: string;
  }>;
};

/** Extracts beforeFiles rewrites regardless of Next.js return shape. */
function getBeforeFiles(
  rewritesResult:
    Awaited<ReturnType<NonNullable<typeof nextConfig.rewrites>>> | undefined
): RewriteRule[] | undefined {
  if (!rewritesResult || Array.isArray(rewritesResult)) {
    return undefined;
  }

  return rewritesResult.beforeFiles;
}

describe("web gateway rewrites", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not include legacy Vercel analytics gateway rewrite rules", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult) ?? [];

    for (const marker of HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS) {
      expect(
        beforeFiles.some((rule) => rule.source.includes(marker)),
        `rewrite source must not include ${marker}`
      ).toBe(false);
    }
  });

  it("forwards store routes to the store zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const storeOrigin = `http://localhost:${DEV_PORTS.store}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/store", destination: `${storeOrigin}/store` },
        { source: "/store/:path*", destination: `${storeOrigin}/store/:path*` },
      ])
    );
  });

  it("forwards pdf routes to the pdf zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const pdfOrigin = `http://localhost:${DEV_PORTS.pdf}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/pdf", destination: `${pdfOrigin}/pdf` },
        { source: "/pdf/:path*", destination: `${pdfOrigin}/pdf/:path*` },
      ])
    );
  });

  it("forwards image-editor routes to the image-editor zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const imageEditorOrigin = `http://localhost:${DEV_PORTS.imageEditor}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/image-editor",
          destination: `${imageEditorOrigin}/image-editor`,
        },
        {
          source: "/image-editor/:path*",
          destination: `${imageEditorOrigin}/image-editor/:path*`,
        },
      ])
    );
  });

  it("forwards ocr routes to the ocr zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const ocrOrigin = `http://localhost:${DEV_PORTS.ocr}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/ocr",
          destination: `${ocrOrigin}/ocr`,
        },
        {
          source: "/ocr/:path*",
          destination: `${ocrOrigin}/ocr/:path*`,
        },
      ])
    );
  });

  it("does not forward retired zone routes", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult) ?? [];
    const sources = beforeFiles.map((rule) => rule.source);

    expect(sources.some((source) => source.startsWith("/auth"))).toBe(false);
    expect(sources.some((source) => source.startsWith("/tasks"))).toBe(false);
    expect(sources.some((source) => source.startsWith("/contacts"))).toBe(
      false
    );
    expect(sources.some((source) => source.startsWith("/notes"))).toBe(false);
    expect(sources.some((source) => source.startsWith("/links"))).toBe(false);
    expect(sources.some((source) => source.startsWith("/image-upscaler"))).toBe(
      false
    );
  });

  it("uses localhost rewrite targets in production when gateway env vars are unset and not on Vercel", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("STORE_URL", "");
    vi.stubEnv("PDF_URL", "");
    vi.stubEnv("IMAGE_EDITOR_URL", "");
    vi.stubEnv("OCR_URL", "");

    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const storeOrigin = `http://localhost:${DEV_PORTS.store}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/store/:path*",
          destination: `${storeOrigin}/store/:path*`,
        },
      ])
    );
  });

  it("requires STORE_URL on Vercel production when unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("STORE_URL", "");

    await expect(nextConfig.rewrites?.()).rejects.toThrow(
      "STORE_URL is required on Vercel in production."
    );
  });

  it("requires IMAGE_EDITOR_URL on Vercel production when unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("STORE_URL", "https://helvety-store.vercel.app");
    vi.stubEnv("PDF_URL", "https://helvety-pdf.vercel.app");
    vi.stubEnv("IMAGE_EDITOR_URL", "");
    vi.stubEnv("OCR_URL", "https://helvety-ocr.vercel.app");

    await expect(nextConfig.rewrites?.()).rejects.toThrow(
      "IMAGE_EDITOR_URL is required on Vercel in production."
    );
  });

  it("requires OCR_URL on Vercel production when unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("STORE_URL", "https://helvety-store.vercel.app");
    vi.stubEnv("PDF_URL", "https://helvety-pdf.vercel.app");
    vi.stubEnv("IMAGE_EDITOR_URL", "https://helvety-image-editor.vercel.app");
    vi.stubEnv("OCR_URL", "");

    await expect(nextConfig.rewrites?.()).rejects.toThrow(
      "OCR_URL is required on Vercel in production."
    );
  });
});
