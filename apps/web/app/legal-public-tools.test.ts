import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Browser-local Helvety tools that do not require an account. */
const PUBLIC_LOCAL_TOOL_NAMES = [
  "Helvety PDF",
  "Helvety Image Editor",
  "Helvety OCR",
] as const;

/** Per-product services bullets: name, URL slug, and a local-processing phrase. */
const PUBLIC_LOCAL_TOOL_SECTION2 = [
  {
    name: "Helvety PDF",
    url: "helvety.com/pdf",
    localPhrase: "keep file contents inside your browser",
  },
  {
    name: "Helvety Image Editor",
    url: "helvety.com/image-editor",
    localPhrase: "run locally",
  },
  {
    name: "Helvety OCR",
    url: "helvety.com/ocr",
    localPhrase: "Text extraction runs locally",
  },
] as const;

/** Collapses JSX whitespace so multi-line legal copy assertions stay stable. */
function normalizeLegalSource(source: string): string {
  return source.replace(/\s+/g, " ");
}

/**
 * Returns the text between two anchors (exclusive of the closing anchor),
 * with whitespace collapsed so product names match across prettier wraps.
 */
function sliceBetween(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  expect(from, `missing anchor: ${start}`).toBeGreaterThanOrEqual(0);
  const to = source.indexOf(end, from);
  expect(to, `missing anchor: ${end}`).toBeGreaterThan(from);
  return normalizeLegalSource(source.slice(from, to));
}

describe("legal pages enumerate public local-processing tools", () => {
  it.each([
    ["privacy", "apps/web/app/privacy/page.tsx"],
    ["terms", "apps/web/app/terms/page.tsx"],
    ["impressum", "apps/web/app/impressum/page.tsx"],
  ] as const)("%s mentions every public local tool", (_label, rel) => {
    const source = readFileSync(join(repoRoot, rel), "utf8");
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(source, `${rel} must mention ${name}`).toContain(name);
    }
  });

  it.each(PUBLIC_LOCAL_TOOL_SECTION2)(
    "privacy services section documents $name local processing",
    ({ name, url, localPhrase }) => {
      const source = readFileSync(
        join(repoRoot, "apps/web/app/privacy/page.tsx"),
        "utf8"
      );
      expect(source).toContain(`${name} (${url}):`);
      expect(normalizeLegalSource(source)).toContain(localPhrase);
    }
  );

  it("privacy and terms do not mention removed products", () => {
    for (const rel of [
      "apps/web/app/privacy/page.tsx",
      "apps/web/app/terms/page.tsx",
      "apps/web/app/impressum/page.tsx",
    ] as const) {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      expect(source).not.toContain("Helvety Image Upscaler");
      expect(source).not.toContain("Helvety Auth");
      expect(source).not.toContain("Helvety Tasks");
      expect(source).not.toContain("Helvety Contacts");
      expect(source).not.toContain("Helvety Notes");
      expect(source).not.toContain("Helvety Links");
      expect(source).not.toContain("image-upscaler");
      expect(source).not.toMatch(/end-to-end encrypt/i);
      expect(source).not.toMatch(/\bE2EE\b/);
      expect(source).not.toContain("Helvety Browser Extension");
      expect(source).not.toContain("passkey");
    }
  });

  it("terms section on product access documents no-account access for every public local tool", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/terms/page.tsx"), "utf8")
    );
    const section = sliceBetween(
      source,
      "Product Access Characteristics",
      "Product Access and Availability"
    );

    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(section, `terms must mention ${name}`).toContain(name);
    }
    expect(section).toContain("never asks you to log in for routine PDF edits");
    expect(section).toContain("standard annotation flow");
    expect(section).toContain("standard text-extraction flow");
    expect(section).not.toContain("standard upscaling flow");
  });
});

/**
 * Substantive parity: local-processing and no-training statements must cover
 * every public local tool.
 */
describe("legal local-processing statements cover every public local tool", () => {
  it("privacy AI training statement names every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    const statement = sliceBetween(
      source,
      "AI model training and retention statement:",
      "3. What We Collect"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(
        statement,
        `privacy training statement must mention ${name}`
      ).toContain(name);
    }
    expect(statement).toContain("the current architecture");
    expect(statement).toContain("minimal server-side endpoints");
    expect(statement).not.toContain("Image Upscaler");
  });

  it("privacy how-we-use section lists every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    const purposes = sliceBetween(
      source,
      "4. How We Use Information",
      "5. Processors and Third Parties"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(purposes, `privacy §4 must mention ${name}`).toContain(name);
    }
    expect(purposes).toContain("local-only browser file tools");
    expect(purposes).toContain("the current architecture");
    expect(purposes).not.toContain("Image Upscaler");
  });

  it("terms license carve-out names every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/terms/page.tsx"),
      "utf8"
    );
    const section = sliceBetween(
      source,
      "5.2 License to Us",
      "5.3 Your Responsibilities"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(section, `terms 5.2 must mention ${name}`).toContain(name);
    }
    expect(section).toContain("the current architecture");
    expect(section).toContain("PDF contents, or extracted text");
    expect(section).not.toContain("Image Upscaler");
  });

  it("terms responsibilities name every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/terms/page.tsx"),
      "utf8"
    );
    const section = sliceBetween(
      source,
      "5.3 Your Responsibilities",
      "6. Intellectual Property and Source"
    );
    expect(section).toContain("extracted text");
    expect(section).toContain("PDFs and images");
    expect(section).not.toContain("Image Upscaler");
  });
});
