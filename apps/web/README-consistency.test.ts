import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const readmePath = join(dirname(fileURLToPath(import.meta.url)), "README.md");

describe("apps/web README gateway zones", () => {
  const readme = readFileSync(readmePath, "utf8");

  it("documents gateway rewrites and zone URLs", () => {
    expect(readme).toContain("/pdf");
    expect(readme).toContain("/image-editor");
    expect(readme).toContain("/ocr");
    expect(readme).toMatch(/pdf.*image-editor.*ocr/is);
    expect(readme).toContain("IMAGE_EDITOR_URL");
    expect(readme).toContain("OCR_URL");
    expect(readme).not.toContain("/image-upscaler");
    expect(readme).not.toContain("IMAGE_UPSCALER_URL");
  });

  it("lists public zones in the public sitemap index section", () => {
    expect(readme).toMatch(/sitemap-index\.xml.*\bimage-editor\b/is);
    expect(readme).toMatch(/sitemap-index\.xml.*\bocr\b/is);
    expect(readme).not.toMatch(/sitemap-index\.xml.*\bimage-upscaler\b/is);
  });
});
