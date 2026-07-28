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

describe("Vercel env audit script", () => {
  it("passes on the monorepo env tier expectations via auditProjectEnv", () => {
    const output = execFileSync(
      process.execPath,
      [
        "-e",
        `import { auditProjectEnv } from './scripts/audit-vercel-production-env.mjs';
         import { EXPECTED_KEYS_BY_APP } from './scripts/env-template-expectations.mjs';
         for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
           const { errors } = auditProjectEnv({ project: app, app, keys, target: 'production' });
           if (errors.length) { console.error(errors.join('\\n')); process.exit(1); }
         }
         console.log('auditProjectEnv tier smoke passed.');`,
      ],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("auditProjectEnv tier smoke passed.");
  });
});

describe("workspace script parity script", () => {
  it("passes when lint/test workspaces define lint:fix and test:coverage", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "check-workspace-script-parity.mjs")],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("Workspace script parity checks passed.");
  });
});

describe("clean artifacts script", () => {
  it("runs idempotently without error", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "clean-artifacts.mjs")],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, HELVEY_SKIP_COVERAGE_CLEAN: "1" },
      }
    );
    expect(output).toContain("[clean:artifacts]");
  });
});

describe("test hygiene script", () => {
  it("passes on the monorepo test floor (required app tests, no focused tests)", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "check-test-hygiene.mjs")],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("Test hygiene checks passed");
  });
});

describe("customer copy style script", () => {
  it("passes when user-facing copy has no em-dashes", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "check-customer-copy-style.mjs")],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("customer copy style OK");
  });
});

describe("consistency guardrails script", () => {
  it("passes on the monorepo cross-workspace invariants", () => {
    const output = execFileSync(
      process.execPath,
      [join(repoRoot, "scripts", "check-consistency-guardrails.mjs")],
      { cwd: repoRoot, encoding: "utf8" }
    );
    expect(output).toContain("Consistency guardrail checks passed.");
  });
});
