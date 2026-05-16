import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const llmsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/llms.txt"
);

describe("Helvety Links llms.txt", () => {
  const source = readFileSync(llmsPath, "utf8");

  it("documents core product behavior aligned with the app", () => {
    expect(source).toMatch(/Virtual \*\*All\*\* folder/);
    expect(source).toMatch(/drag-and-drop/i);
    expect(source).toContain("2,000 folders and 2,000 links");
    expect(source).toMatch(/before storage/i);
    expect(source).toMatch(/Dashboard command bar/i);
    expect(source).toMatch(/open links in a folder/i);
  });

  it("states non-indexable auth-required routing", () => {
    expect(source).toContain("https://helvety.com/links");
    expect(source).toMatch(/not to be indexed/i);
    expect(source).toMatch(/noindex/i);
  });
});
