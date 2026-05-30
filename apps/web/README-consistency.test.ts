import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const readmePath = join(dirname(fileURLToPath(import.meta.url)), "README.md");

describe("apps/web README gateway zones", () => {
  const readme = readFileSync(readmePath, "utf8");

  it("documents Helvety Docs rewrites and DOCS_URL", () => {
    expect(readme).toContain("/docs");
    expect(readme).toContain("DOCS_URL");
    expect(readme).toMatch(/pdf.*docs.*image-upscaler/i);
  });

  it("lists docs in the public sitemap index section", () => {
    expect(readme).toMatch(/sitemap-index\.xml.*\bdocs\b/is);
  });
});
