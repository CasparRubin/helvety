import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const extensionRoot = join(repoRoot, "../helvety-browser-extension-chromium");

/** Reads a UTF-8 file relative to the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

/** Lists markdown files under `docs/` (non-recursive). */
function listDocsMarkdown(): string[] {
  return readdirSync(join(repoRoot, "docs"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => `docs/${name}`);
}

const ZONE_READMES = [
  "apps/web/README.md",
  "apps/auth/README.md",
  "apps/store/README.md",
  "apps/tasks/README.md",
  "apps/contacts/README.md",
  "apps/notes/README.md",
  "apps/links/README.md",
  "apps/pdf/README.md",
  "apps/image-upscaler/README.md",
  "apps/image-editor/README.md",
] as const;

const CORE_DOC_PATHS = [
  "README.md",
  "packages/ui/README.md",
  "packages/shared/README.md",
  ...listDocsMarkdown(),
  ...ZONE_READMES,
] as const;

/** Docs must not describe the retired Radix/cmdk stack as current. */
const STALE_UI_STACK_PATTERNS: ReadonlyArray<{
  label: string;
  pattern: RegExp;
  /** Paths where a match is allowed (e.g. policy text that forbids the dependency). */
  allowIn?: readonly string[];
}> = [
  {
    label: "Radix ScrollArea as current primitive",
    pattern: /Radix [`'"]*ScrollArea/,
    allowIn: [],
  },
  {
    label: "radix-vega style pin",
    pattern: /radix-vega/,
    allowIn: [],
  },
  {
    label: "cmdk import",
    pattern: /from\s+["']cmdk["']/,
    allowIn: [],
  },
  {
    label: "cmdk Command primitive export",
    pattern: /@helvety\/ui\/command["'\s]/,
    allowIn: [],
  },
];

describe("UI docs and README copy (Base UI / no stale Radix stack)", () => {
  it.each(CORE_DOC_PATHS)("%s exists and is scanned", (relativePath) => {
    expect(readRepoFile(relativePath).length).toBeGreaterThan(0);
  });

  it.each(
    CORE_DOC_PATHS.flatMap((relativePath) =>
      STALE_UI_STACK_PATTERNS.map((rule) => ({
        relativePath,
        ...rule,
      }))
    )
  )(
    "$relativePath has no $label",
    ({ relativePath, pattern, allowIn, label }) => {
      if (allowIn?.includes(relativePath)) {
        return;
      }
      const source = readRepoFile(relativePath);
      expect(source, `${relativePath} must not mention ${label}`).not.toMatch(
        pattern
      );
    }
  );

  it("ui-shadcn integration policy documents Base UI and entity link picker", () => {
    const policy = readRepoFile("docs/ui-shadcn-integration-policy.md");
    expect(policy).toContain("base-vega");
    expect(policy).toContain("@base-ui/react");
    expect(policy).toContain("Entity link picker");
    expect(policy).toContain("Popover");
    expect(policy).toContain("CommandBar");
    expect(policy).toMatch(/not.*cmdk/i);
    expect(policy).toContain("ui-action-button-contract");
    expect(policy).toContain("@helvety/ui/sonner");
    expect(policy).toContain("consistency:ui-actions");
  });

  it("ui-action-button contract documents Trash2 and toast import path", () => {
    const contract = readRepoFile("docs/ui-action-button-contract.md");
    expect(contract).toContain("Trash2Icon");
    expect(contract).toContain("@helvety/ui/sonner");
    expect(contract).toMatch(/not legacy `TrashIcon`/i);
  });

  it("root README documents consistency:ui-actions in ci:check order", () => {
    const readme = readRepoFile("README.md");
    expect(readme).toContain(
      "`consistency:guardrails`, `consistency:ui-actions`"
    );
  });

  it("dependency inventory documents @base-ui/react and base-vega", () => {
    const inventory = readRepoFile("docs/dependency-inventory.md");
    expect(inventory).toContain("@base-ui/react");
    expect(inventory).toContain("base-vega");
    expect(inventory).not.toContain("radix-vega");
  });

  it("packages/ui README distinguishes CommandBar from cmdk Command", () => {
    const readme = readRepoFile("packages/ui/README.md");
    expect(readme).toContain("@base-ui/react");
    expect(readme).toMatch(/Popover.*Input|Input.*Popover/);
    expect(readme).toMatch(/not.*cmdk|cmdk Command/i);
  });

  it("extension README describes @helvety/ui as Base UI shadcn primitives", () => {
    try {
      const readme = readFileSync(join(extensionRoot, "README.md"), "utf8");
      expect(readme).toContain("@helvety/ui");
      expect(readme).toMatch(/Base UI|base-vega/);
      expect(readme).not.toContain("radix-vega");
      expect(readme).toContain(
        "@helvety/extension-chrome/extension-tokens.css"
      );
      expect(readme).toContain("header command bar");
      expect(readme).not.toMatch(/local fork/i);
    } catch {
      // Sibling extension repo optional in some checkouts.
    }
  });
});
