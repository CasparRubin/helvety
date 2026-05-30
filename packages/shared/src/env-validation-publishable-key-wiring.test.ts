import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Source of env-validation for static publishable-key policy checks. */
function readEnvValidationSource(): string {
  return readFileSync(
    join(repoRoot, "packages/shared/src/env-validation.ts"),
    "utf8"
  );
}

describe("env-validation publishable key wiring", () => {
  it("accepts sb_publishable_* only for NEXT_PUBLIC keys (no JWT anon branch)", () => {
    const src = readEnvValidationSource();
    expect(src).toContain('startsWith("sb_publishable_")');
    expect(src).not.toMatch(/startsWith\("eyJ"\)/);
    expect(src).not.toContain("jwtParts");
  });
});
