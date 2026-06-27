import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const readmePath = join(dirname(fileURLToPath(import.meta.url)), "README.md");

describe("apps/web README gateway zones", () => {
  const readme = readFileSync(readmePath, "utf8");

  it("documents gateway rewrites and zone URLs", () => {
    expect(readme).toContain("/pdf");
    expect(readme).toContain("/image-upscaler");
    expect(readme).toMatch(/pdf.*image-upscaler/i);
  });

  it("lists public zones in the public sitemap index section", () => {
    expect(readme).toMatch(/sitemap-index\.xml.*\bimage-upscaler\b/is);
  });
});
