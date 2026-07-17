import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

describe("version generator wiring", () => {
  const source = readFileSync(
    join(repoRoot, "scripts", "generate-version.mjs"),
    "utf8"
  );

  it("generates an honest timezone-qualified timestamp", () => {
    expect(source).toContain('DISPLAY_TIME_ZONE = "Europe/Zurich"');
    expect(source).toContain("Generated on ${dateTimeParts.day}");
    expect(source).not.toContain("Built on ${");
    expect(source).not.toContain("auto-generated at build time");
  });
});
