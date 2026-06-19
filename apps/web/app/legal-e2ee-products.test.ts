import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Collapses JSX whitespace so multi-line legal copy assertions stay stable. */
function normalizeLegalSource(source: string): string {
  return source.replace(/\s+/g, " ");
}

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

  it("privacy self-service deletion lists Links and Docs data categories", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    expect(source).toContain("link data (Helvety Links)");
    expect(source).toMatch(/document vault data \(Helvety\s+Docs\)/);
    expect(source).not.toMatch(
      /task data, contact data,\s+and note data\.\s+Full propagation/
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

  it("privacy section 2.8 Notes metadata matches section 10.2 E2EE disclosures", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/privacy/page.tsx"), "utf8")
    );
    const categoryPhrase =
      "immutable built-in taxonomy references (category IDs)";
    const section28Start = source.indexOf("Helvety Notes (helvety.com/notes):");
    const section102Start = source.indexOf("Helvety Notes encrypted fields:");
    expect(section28Start).toBeGreaterThanOrEqual(0);
    expect(section102Start).toBeGreaterThanOrEqual(0);

    const section28 = source.slice(section28Start, section28Start + 900);
    const section102 = source.slice(section102Start, section102Start + 600);
    expect(section28).toContain(categoryPhrase);
    expect(section102).toContain(categoryPhrase);
  });

  it("privacy documents cross-app linking metadata for every E2EE app section", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/privacy/page.tsx"), "utf8")
    );
    const crossAppLinkingPhrase =
      "When linking with other Helvety E2EE apps, additional non-encrypted relationship metadata";
    for (const marker of [
      "Helvety Tasks (helvety.com/tasks):",
      "Helvety Contacts (helvety.com/contacts):",
      "Helvety Notes (helvety.com/notes):",
      "Helvety Links (helvety.com/links):",
    ]) {
      const start = source.indexOf(marker);
      expect(start, `missing ${marker}`).toBeGreaterThanOrEqual(0);
      const section = source.slice(start, start + 1400);
      expect(section, `${marker} must disclose cross-app linking`).toContain(
        crossAppLinkingPhrase
      );
    }
  });

  it("privacy and terms qualify cross-app linking metadata across all E2EE apps", () => {
    for (const rel of [
      "apps/web/app/privacy/page.tsx",
      "apps/web/app/terms/page.tsx",
    ] as const) {
      const source = normalizeLegalSource(
        readFileSync(join(repoRoot, rel), "utf8")
      );
      expect(source).toContain(
        "where you use cross-app linking across those apps, relationship metadata between entities"
      );
      expect(source).not.toContain("When linking contacts with task entities");
      expect(source).not.toContain(
        "When linking notes with tasks and contacts"
      );
    }
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
      const source = normalizeLegalSource(
        readFileSync(join(repoRoot, rel), "utf8")
      );
      expect(source).toContain("Depending on the app");
      expect(source).toContain(
        "for Helvety Links, folder parent/child relationships"
      );
      for (const phrase of TASKS_ONLY_METADATA_PHRASES) {
        expect(
          source,
          `${rel} must not blanket-list: ${phrase.slice(0, 40)}…`
        ).not.toContain(phrase.replace(/\s+/g, " "));
      }
    }
  );

  it("terms Encryption Setup qualifies metadata by product", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/terms/page.tsx"), "utf8")
    );
    expect(source).toContain(
      "folder parent/child relationships in Helvety Links, priority levels and stage/label references in Helvety Tasks, and relationship metadata when you link entities across Helvety Tasks, Contacts, Notes, and Links"
    );
    expect(source).not.toContain(
      "priority levels, display preferences (e.g., sort orders), and entity relationships"
    );
  });
});
