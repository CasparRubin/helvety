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

  it.each([
    ["privacy", "apps/web/app/privacy/page.tsx"],
    ["terms", "apps/web/app/terms/page.tsx"],
    ["impressum", "apps/web/app/impressum/page.tsx"],
  ] as const)(
    "%s documents Helvety Docs hybrid local and optional vault modes",
    (_label, rel) => {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      expect(source).toContain("Helvety Docs");
      expect(source).toMatch(/optional vault|vault save/i);
    }
  );

  it("privacy documents Helvety Docs service URL in section 2.8", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    expect(source).toContain("Helvety Docs (helvety.com/docs)");
    expect(source).toMatch(/optional\s+vault|vault save/i);
    expect(source).not.toMatch(
      /Helvety Tasks, Helvety Contacts, Helvety Notes, Helvety Links, and Helvety Docs/
    );
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

/** Metadata types that apply only to Tasks, Contacts, or Notes—not Helvety Links. */
const TASKS_ONLY_METADATA_PHRASES = [
  "priority levels, display preferences (e.g., sort orders), and entity relationships",
  "(priority levels, display preferences such as sort orders, entity relationships, and immutable built-in taxonomy references)",
  "task priority,\n            stage/label/category references, and relationship/link metadata\n            where linking is used",
] as const;

describe("E2EE metadata disclosures qualify fields by product", () => {
  it.each([
    ["terms", "apps/web/app/terms/page.tsx"],
    ["privacy", "apps/web/app/privacy/page.tsx"],
  ] as const)(
    "%s does not attribute Tasks-only metadata to all E2EE apps",
    (_label, rel) => {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      expect(source).toContain("Depending on the app");
      expect(source).toMatch(
        /for Helvety\s+Links,\s+folder parent\/child relationships/
      );
      for (const phrase of TASKS_ONLY_METADATA_PHRASES) {
        expect(
          source,
          `${rel} must not blanket-list: ${phrase.slice(0, 40)}…`
        ).not.toContain(phrase);
      }
    }
  );

  it("terms Encryption Setup qualifies metadata by product", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/terms/page.tsx"),
      "utf8"
    );
    expect(source).toMatch(
      /parent\/child\s+relationships in Helvety Links, or priority levels/
    );
    expect(source).not.toContain(
      "priority levels, display preferences (e.g., sort orders), and entity relationships"
    );
  });
});
