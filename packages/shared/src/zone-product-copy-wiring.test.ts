import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("zone product copy re-exports", () => {
  it("pdf product-copy re-exports shared SEO strings", () => {
    const src = readFileSync(
      join(repoRoot, "apps/pdf/lib/product-copy.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/app-product-descriptions");
    expect(src).toContain("PDF_APP_DESCRIPTION");
    expect(src).toContain("PDF_PWA_MANIFEST_DESCRIPTION");
  });

  it("image-upscaler product-copy re-exports shared SEO strings", () => {
    const src = readFileSync(
      join(repoRoot, "apps/image-upscaler/lib/product-copy.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/app-product-descriptions");
    expect(src).toContain("IMAGE_UPSCALER_APP_DESCRIPTION");
    expect(src).toContain("IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION");
  });

  it("image-editor product-copy re-exports shared SEO strings", () => {
    const src = readFileSync(
      join(repoRoot, "apps/image-editor/lib/product-copy.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/app-product-descriptions");
    expect(src).toContain("IMAGE_EDITOR_APP_DESCRIPTION");
    expect(src).toContain("IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION");
  });

  it("ocr product-copy re-exports shared SEO strings", () => {
    const src = readFileSync(
      join(repoRoot, "apps/ocr/lib/product-copy.ts"),
      "utf8"
    );
    expect(src).toContain("@helvety/shared/app-product-descriptions");
    expect(src).toContain("OCR_APP_DESCRIPTION");
    expect(src).toContain("OCR_PWA_MANIFEST_DESCRIPTION");
  });
});
