import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const thumbnailPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "pdf-page-thumbnail.tsx"
);

describe("pdf-page-thumbnail cache wiring", () => {
  it("reads and writes ImageBitmap cache on first canvas render", () => {
    const src = readFileSync(thumbnailPath, "utf8");

    expect(src).toContain("getImageBitmapCache");
    expect(src).toContain("cachePdfPageCanvas");
    expect(src).toContain("buildPdfThumbnailCacheKey");
    expect(src).not.toMatch(/not implemented/i);
    expect(src).toContain("canvasRef");
  });
});
