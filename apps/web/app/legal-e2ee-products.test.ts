import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const E2EE_PRODUCT_NAMES = [
  "Helvety Tasks",
  "Helvety Contacts",
  "Helvety Notes",
  "Helvety Links",
] as const;

describe("legal pages enumerate E2EE products", () => {
  it.each([
    ["privacy", "apps/web/app/privacy/page.tsx"],
    ["terms", "apps/web/app/terms/page.tsx"],
    ["impressum", "apps/web/app/impressum/page.tsx"],
  ] as const)("%s mentions every E2EE app", (_label, rel) => {
    const source = readFileSync(join(repoRoot, rel), "utf8");
    for (const name of E2EE_PRODUCT_NAMES) {
      expect(source, `${rel} must mention ${name}`).toContain(name);
    }
  });

  it("privacy documents Links encrypted fields", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    expect(source).toContain("Helvety Links encrypted fields");
    expect(source).toContain("folder name");
    expect(source).toContain("link name and URL");
    expect(source).toContain("2,000 each");
  });

  it("privacy does not list only three E2EE apps in shared disclosure sections", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    expect(source).not.toContain(
      "Helvety Contacts, and Helvety Notes (for example record identifiers"
    );
    expect(source).not.toContain(
      "For Helvety Tasks, Helvety Contacts, and Helvety Notes:"
    );
  });
});

describe("store Helvety Links copy", () => {
  it("does not claim unlimited folders or drag-and-drop reorder", () => {
    const source = readFileSync(
      join(repoRoot, "apps/store/lib/data/products.ts"),
      "utf8"
    );
    const linksBlock = source.slice(source.indexOf('slug: "helvety-links"'));
    expect(linksBlock).not.toMatch(/Unlimited nested/i);
    expect(linksBlock).not.toContain(
      "Reorder links and folders within the same parent folder"
    );
    expect(linksBlock).not.toContain("Drag and drop reorder");
  });
});
