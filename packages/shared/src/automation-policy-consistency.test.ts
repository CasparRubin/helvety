import { constants } from "node:fs";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");

const AUTOMATION_DOC_PATHS = [
  "README.md",
  "docs/README.md",
  "docs/app-consistency-checklist.md",
  "docs/quality-modernization-baseline.md",
  "docs/dependency-inventory.md",
  "docs/security-review-runbook.md",
  "docs/vercel-monorepo-apps.md",
  "docs/naming-conventions.md",
  "docs/legal-change-guardrails.md",
] as const;

const STALE_AUTOMATION_PHRASES = [
  "GitHub Actions",
  ".github/workflows/ci.yml",
  ".github/workflows/",
  "Remote CI:",
  "## Automated (CI)",
  "## CI guardrail",
  "Optional CI/monorepo",
  "CI guards this",
  "CI checks expected",
  "CI guardrails keep",
  "Enforced in CI",
] as const;

/** Lists `apps/<slug>/README.md` paths for zone app documentation checks. */
async function listAppReadmePaths(): Promise<string[]> {
  const entries = await readdir(resolve(repoRoot, "apps"), {
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `apps/${entry.name}/README.md`);
}

describe("automation policy consistency", () => {
  it("does not ship GitHub Actions workflow files", async () => {
    await expect(
      access(resolve(repoRoot, ".github/workflows"), constants.F_OK)
    ).rejects.toThrow();
  });

  it("extension sibling does not ship GitHub Actions workflow files", async () => {
    const extensionRoot = resolve(
      repoRoot,
      "../helvety-browser-extension-chromium"
    );
    try {
      await access(extensionRoot, constants.F_OK);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }

    await expect(
      access(resolve(extensionRoot, ".github/workflows"), constants.F_OK)
    ).rejects.toThrow();
  });

  it.each(AUTOMATION_DOC_PATHS)(
    "%s avoids stale remote-CI / GitHub Actions wording",
    async (relativePath) => {
      const source = await readFile(resolve(repoRoot, relativePath), "utf8");

      for (const phrase of STALE_AUTOMATION_PHRASES) {
        expect(source, `${relativePath} contains stale phrase`).not.toContain(
          phrase
        );
      }

      if (relativePath === "README.md") {
        expect(source).toContain("bun run ci:check");
        expect(source).toContain("bun run ci:release");
        expect(source).toMatch(/Vercel builds and deploys/i);
        expect(source).toContain("docs/README.md");
      }
    }
  );

  it("zone app READMEs avoid stale remote-CI env wording", async () => {
    for (const relativePath of await listAppReadmePaths()) {
      const source = await readFile(resolve(repoRoot, relativePath), "utf8");
      for (const phrase of [
        "Optional CI/monorepo",
        "CI guardrails keep",
        "For monorepo setup and CI/release",
      ] as const) {
        expect(source, `${relativePath} contains stale phrase`).not.toContain(
          phrase
        );
      }
    }
  });
});
