import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..", "..");

describe("dependency security floor script", () => {
  it("passes on the monorepo with current security floors", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "check-security-dependency-floors.mjs")],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("Security dependency floors passed.");
  });
});

describe("workspace version drift script", () => {
  it("passes when workspace dependency specifiers are aligned", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "check-workspace-version-drift.mjs")],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("No workspace dependency drift detected.");
  });
});
