import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const hookPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "use-pdf-files.ts"
);

describe("usePdfFiles cache wiring", () => {
  it("derives PDF cache caps from shared CACHE_LIMITS", () => {
    const src = readFileSync(hookPath, "utf8");

    expect(src).toContain("CACHE_LIMITS.MAX_CACHED_PDFS");
    expect(src).toContain("CACHE_LIMITS.MOBILE_MAX_CACHED_PDFS");
    expect(src).toContain("getRecommendedCacheLimit");
    expect(src).not.toContain("MAX_PDF_CACHE_ENTRIES");
  });
});
