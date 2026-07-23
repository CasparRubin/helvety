import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Browser-local Helvety tools that do not use full-app E2EE. */
const PUBLIC_LOCAL_TOOL_NAMES = [
  "Helvety PDF",
  "Helvety Image Upscaler",
  "Helvety Image Editor",
  "Helvety OCR",
] as const;

/** Per-product §2 bullets: name, URL slug, and a local-processing phrase. */
const PUBLIC_LOCAL_TOOL_SECTION2 = [
  {
    name: "Helvety PDF",
    url: "helvety.com/pdf",
    localPhrase: "keep file contents inside your browser",
  },
  {
    name: "Helvety Image Upscaler",
    url: "helvety.com/image-upscaler",
    localPhrase: "processed in your browser",
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
    "privacy §2 documents $name local processing",
    ({ name, url, localPhrase }) => {
      const source = readFileSync(
        join(repoRoot, "apps/web/app/privacy/page.tsx"),
        "utf8"
      );
      expect(source).toContain(`${name} (${url}):`);
      expect(normalizeLegalSource(source)).toContain(localPhrase);
    }
  );

  it("privacy and terms enumerate all public local tools among non-E2EE services", () => {
    const nonE2eeEnumeration =
      /Helvety PDF, Helvety Image Upscaler, Helvety Image Editor, Helvety OCR, Helvety Store/;

    for (const rel of [
      "apps/web/app/privacy/page.tsx",
      "apps/web/app/terms/page.tsx",
    ] as const) {
      const source = normalizeLegalSource(
        readFileSync(join(repoRoot, rel), "utf8")
      );
      for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
        expect(source, `${rel} must mention ${name}`).toContain(name);
      }
      expect(source, `${rel} non-E2EE enumeration`).toMatch(nonE2eeEnumeration);
    }
  });

  it("privacy §2 documents Helvety Image Upscaler model-weight download host", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/privacy/page.tsx"), "utf8")
    );
    expect(source).toContain(
      "Helvety Image Upscaler (helvety.com/image-upscaler):"
    );
    expect(source).toContain("Helvety-hosted storage");
    expect(source).toContain("not your image pixels");
  });

  it("terms 4.6 discloses Upscaler Helvety-hosted weights and Maguna Hugging Face weights", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/terms/page.tsx"), "utf8")
    );
    const section = sliceBetween(
      source,
      "4.6 AI-assisted tools (including Helvety Image Upscaler)",
      "5. Free Services and Beta Features"
    );
    expect(section).toContain("Helvety-hosted storage");
    expect(section).toContain("Hugging Face");
  });

  it("terms section 9.1 documents no-account access for every public local tool", () => {
    const source = normalizeLegalSource(
      readFileSync(join(repoRoot, "apps/web/app/terms/page.tsx"), "utf8")
    );
    const section = sliceBetween(
      source,
      "9.1 Product Access Characteristics",
      "10. Product Access and Availability"
    );

    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(section, `terms 9.1 must mention ${name}`).toContain(name);
    }
    expect(section).toContain("never asks you to log in for routine PDF edits");
    expect(section).toContain("standard upscaling flow");
    expect(section).toContain("standard annotation flow");
    expect(section).toContain("standard text-extraction flow");
  });
});

/**
 * Substantive parity: local-processing and no-training statements must cover
 * every public local tool, not only Image Upscaler / Image Editor.
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
      "3. Legal Basis for Processing"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(
        statement,
        `privacy training statement must mention ${name}`
      ).toContain(name);
    }
    expect(statement).toContain("the current architecture");
    expect(statement).toContain("minimal server-side endpoints");
    expect(statement).toContain("not intended to receive full file payloads");
  });

  it("privacy section 4 purposes lists every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    const purposes = sliceBetween(
      source,
      "4. How We Use Your Data",
      "4.1 Marketing Communications"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(purposes, `privacy §4 must mention ${name}`).toContain(name);
    }
    expect(purposes).toContain("local-only browser file tools");
    expect(purposes).toContain("the current architecture");
    expect(purposes).not.toContain("local-only AI-assisted tooling");
  });

  it("terms 7.2 license carve-out names every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/terms/page.tsx"),
      "utf8"
    );
    const section = sliceBetween(
      source,
      "7.2 License to Us",
      "7.3 Your Responsibilities"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(section, `terms 7.2 must mention ${name}`).toContain(name);
    }
    expect(section).toContain("the current architecture");
    expect(section).toContain("PDF contents, or extracted text");
  });

  it("terms 7.3 responsibilities name every public local tool", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/terms/page.tsx"),
      "utf8"
    );
    const section = sliceBetween(
      source,
      "7.3 Your Responsibilities",
      "7.4 Our Rights"
    );
    for (const name of PUBLIC_LOCAL_TOOL_NAMES) {
      expect(section, `terms 7.3 must mention ${name}`).toContain(name);
    }
    expect(section).toContain("extracted text");
    expect(section).toContain("PDFs and images");
  });
});
