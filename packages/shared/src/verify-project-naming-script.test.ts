import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const scriptPath = join(repoRoot, "scripts", "verify-project-naming.mjs");

describe("verify-project-naming script", () => {
  it("passes on the monorepo (redirect allowlist enforced)", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(output).toContain(
      "verify-project-naming: ok (no forbidden superseded name strings)."
    );
  });
});
