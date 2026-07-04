import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OBSOLETE_VERCEL_ENV_KEYS } from "../../../scripts/audit-vercel-production-env.mjs";

const repoRoot = join(import.meta.dirname, "../../..");

/** Paths that may mention retired docs zone identifiers (audit notes only). */
const RETIRED_DOCS_ZONE_MENTION_ALLOWLIST = new Set([
  "docs/env-vercel-audit-checklist.md",
  "packages/shared/src/retired-docs-zone.test.ts",
  "packages/shared/src/vercel-env-audit.test.ts",
  "packages/shared/src/env-template-consistency.test.ts",
  "scripts/audit-vercel-production-env.mjs",
]);

const RETIRED_DOCS_ZONE_MARKERS = [
  "DOCS_URL",
  "helvety-docs",
  "apps/docs",
  "/docs-static",
  "Helvety Docs",
] as const;

const SCAN_ROOTS = ["apps", "packages", "scripts", "turbo.json"] as const;

/** Recursively lists repo-relative source paths under `dir`. */
function collectSourceFiles(dir: string, base = dir): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const rel = fullPath.slice(base.length + 1);
    if (
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === "coverage"
    ) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath, base));
      continue;
    }
    if (/\.(ts|tsx|mjs|json|env\.template)$/.test(entry)) {
      files.push(rel);
    }
  }
  return files;
}

describe("retired Helvety Docs zone", () => {
  it("exports DOCS_URL as an obsolete Vercel env key", () => {
    expect(OBSOLETE_VERCEL_ENV_KEYS).toContain("DOCS_URL");
  });

  it("does not reference the retired docs zone in app or infra source", () => {
    const offenders: string[] = [];

    for (const root of SCAN_ROOTS) {
      const absRoot = join(repoRoot, root);
      const stat = statSync(absRoot);
      const files = stat.isDirectory()
        ? collectSourceFiles(absRoot, absRoot).map((rel) => join(root, rel))
        : [root];

      for (const rel of files) {
        if (RETIRED_DOCS_ZONE_MENTION_ALLOWLIST.has(rel)) {
          continue;
        }
        const source = readFileSync(join(repoRoot, rel), "utf8");
        for (const marker of RETIRED_DOCS_ZONE_MARKERS) {
          if (source.includes(marker)) {
            offenders.push(`${rel}: ${marker}`);
          }
        }
      }
    }

    expect(
      offenders,
      "retired docs zone markers must not appear in source"
    ).toEqual([]);
  });
});
