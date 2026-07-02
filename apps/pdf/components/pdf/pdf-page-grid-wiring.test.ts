import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const gridPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "pdf-page-grid.tsx"
);

describe("PdfPageGrid rotation wiring", () => {
  it("uses shared computeEffectiveRotation for thumbnail display", () => {
    const src = readFileSync(gridPath, "utf8");

    expect(src).toContain("computeEffectiveRotation");
    expect(src).not.toMatch(
      /const effectiveRotation = \(inherentRotation \+ userRotation\) % 360/
    );
  });
});
