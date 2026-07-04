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
] as const;

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

  it("privacy section 2.8 documents Image Editor local processing", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/privacy/page.tsx"),
      "utf8"
    );
    expect(source).toContain(
      "Helvety Image Editor (helvety.com/image-editor):"
    );
    expect(source).toContain("Annotation and export workflows run locally");
  });

  it("privacy and terms list Image Editor among non-E2EE services", () => {
    for (const rel of [
      "apps/web/app/privacy/page.tsx",
      "apps/web/app/terms/page.tsx",
    ] as const) {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      expect(source).toContain("Helvety Image Editor");
      expect(source).toContain("Helvety Image Upscaler");
      expect(source).toMatch(/Helvety Image Editor,\s*Helvety Store/);
    }
  });

  it("terms section 9.1 documents no-account Image Editor access", () => {
    const source = readFileSync(
      join(repoRoot, "apps/web/app/terms/page.tsx"),
      "utf8"
    );
    expect(source).toContain("Helvety Image Editor");
    expect(source).toContain("standard annotation flow");
  });
});
