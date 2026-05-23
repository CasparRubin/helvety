import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const llmsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/llms.txt"
);

describe("Helvety Docs llms.txt", () => {
  const source = readFileSync(llmsPath, "utf8");

  it("documents hybrid local edit and optional vault behavior", () => {
    expect(source).toMatch(/\.docx/i);
    expect(source).toMatch(/no account/i);
    expect(source).toMatch(/optional vault/i);
    expect(source).toMatch(/before storage/i);
  });

  it("mentions vault deep links on the canonical URL", () => {
    expect(source).toMatch(/\?doc=/);
    expect(source).toMatch(/vault unlock/i);
  });

  it("links to canonical routes and related Helvety apps", () => {
    expect(source).toContain("https://helvety.com/docs");
    expect(source).toContain("https://helvety.com/store/products/helvety-docs");
    expect(source).toContain("https://helvety.com/pdf");
    expect(source).toMatch(/Apache-2\.0/);
  });
});
