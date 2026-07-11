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
  "apps/ocr/README.md",
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

  it("ui-action-button contract documents canvas tool command bars", () => {
    const contract = readRepoFile("docs/ui-action-button-contract.md");
    expect(contract).toContain(
      "## Canvas tools (PDF, image upscaler, image editor, OCR)"
    );
    expect(contract).toContain("Add File");
    expect(contract).toContain("Add Image");
    expect(contract).toContain("Add Images");
    expect(contract).toContain("Clear Annotations");
    expect(contract).toMatch(/command bar above/i);
    expect(contract).not.toMatch(/toolbar above/i);
  });

  it("root README documents consistency:ui-actions in ci:check order", () => {
    const readme = readRepoFile("README.md");
    expect(readme).toContain(
      "`consistency:guardrails`, `consistency:ui-actions`"
    );
  });

  it("dependency inventory documents @base-ui/react and base-vega", () => {
    const inventory = readRepoFile("docs/dependency-inventory.md");
    const driftConfig = JSON.parse(
      readRepoFile("scripts/workspace-version-drift.config.json")
    ) as { requiredVersionByDep?: Record<string, string> };

    expect(inventory).toContain("@base-ui/react");
    expect(inventory).toContain(
      driftConfig.requiredVersionByDep?.["@base-ui/react"]
    );
    expect(inventory).toContain("base-vega");
    expect(inventory).not.toContain("radix-vega");
  });

  it("packages/ui README distinguishes CommandBar from cmdk Command", () => {
    const readme = readRepoFile("packages/ui/README.md");
    expect(readme).toContain("@base-ui/react");
    expect(readme).toMatch(/Popover.*Input|Input.*Popover/);
    expect(readme).toMatch(/not.*cmdk|cmdk Command/i);
  });

  it("store README documents ecosystem registry as category source of truth", () => {
    const readme = readRepoFile("apps/store/README.md");
    expect(readme).toContain("helvety-ecosystem-sections");
    expect(readme).toContain("STORE_PRODUCT_CARDS_BASE");
    expect(readme).toContain("ecosystemItemIcons");
    expect(readme).toMatch(/Encryption Apps|File Tools|Browser Extensions/);
    expect(readme).not.toMatch(/tinted type labels/i);
    expect(readme).not.toMatch(/per-type tinted labels/i);
    expect(readme).not.toContain(
      "app-switcher-sections.tsx` if the product should appear"
    );
  });

  it("shared README documents helvety-ecosystem-sections as store category SSOT", () => {
    const readme = readRepoFile("packages/shared/README.md");
    expect(readme).toContain("helvety-ecosystem-sections");
    expect(readme).toContain("HELVETY_ECOSYSTEM_PRODUCT_SECTIONS");
    expect(readme).toMatch(/app switcher|store filter/i);
  });

  it("navbar-brand JSDoc references ecosystem registry for AppSwitcher", () => {
    const source = readRepoFile("packages/ui/src/navbar-brand.tsx");
    expect(source).toContain("helvety-ecosystem-sections");
    expect(source).toContain("app-switcher-sections");
  });

  it("legal and naming docs list helvety-ecosystem-sections in store copy sync", () => {
    const legal = readRepoFile("docs/legal-change-guardrails.md");
    const naming = readRepoFile("docs/naming-conventions.md");
    expect(legal).toContain("helvety-ecosystem-sections.ts");
    expect(naming).toContain("helvety-ecosystem-sections.ts");
    expect(naming).toMatch(/Ecosystem category/i);
    expect(naming).toMatch(
      /never imply full-app E2EE for PDF, Image Upscaler, Image Editor, OCR/
    );
    expect(legal).toMatch(/Image Editor, or OCR payload handling/);
  });

  it("cursorrules documents pdfjs worker rule for PDF and OCR zones", () => {
    const cursorrules = readRepoFile(".cursorrules");
    expect(cursorrules).toMatch(/PDF and OCR zones/);
    expect(cursorrules).toContain("consistency:pdfjs-worker");
    expect(cursorrules).toMatch(/validates both zones/);
  });

  it("packages/ui README documents save-first create and selected-entity hook", () => {
    const readme = readRepoFile("packages/ui/README.md");
    expect(readme).toContain("save-first");
    expect(readme).toContain("useE2eeDashboardSelectedEntity");
    expect(readme).toContain("openCreate");
    expect(readme).toContain("formMode");
    expect(readme).toMatch(/first save/i);
    expect(readme).toContain("pickDefinedStructuralFields");
    expect(readme).not.toContain("open-first");
    expect(readme).not.toContain("seedDraft");
  });

  it("gateway hero docs describe the current plain-background stack", () => {
    const heroDocPaths = [
      "README.md",
      "packages/ui/README.md",
      "apps/web/README.md",
      "docs/ui-shadcn-integration-policy.md",
    ] as const;

    const implementationDetailPaths = new Set([
      "README.md",
      "apps/web/README.md",
      "docs/ui-shadcn-integration-policy.md",
    ]);

    const taglineDocPaths = new Set([
      "README.md",
      "packages/ui/README.md",
      "apps/web/README.md",
      "docs/ui-shadcn-integration-policy.md",
    ]);

    for (const relativePath of heroDocPaths) {
      const doc = readRepoFile(relativePath);
      expect(doc, relativePath).toMatch(
        /bg-background|plain theme background/i
      );
      if (taglineDocPaths.has(relativePath)) {
        expect(doc, relativePath).toMatch(/private\s*·\s*simple/i);
        expect(doc, relativePath).toContain("HELVETY_COMPANY_VALUES_TAGLINE");
      }
      expect(doc, relativePath).not.toMatch(/Hyperspeed/i);
      expect(doc, relativePath).not.toMatch(/ElectricBorder/i);
      expect(doc, relativePath).not.toMatch(/HeroHyperspeedLayer/i);
      expect(doc, relativePath).not.toMatch(/\b700ms\b/);
      expect(doc, relativePath).not.toMatch(
        /pagehide|hides before cross-zone/i
      );

      if (implementationDetailPaths.has(relativePath)) {
        expect(doc, relativePath).not.toMatch(/2000ms|duration-2000/i);
        expect(doc, relativePath).not.toMatch(/canUseWebGL|bfcache/i);
        expect(doc, relativePath).toMatch(
          /plain `bg-background`|plain theme background/i
        );
      }
    }
  });

  it("E2EE zone READMEs describe save-first create on first save, not persist-on-open", () => {
    for (const relativePath of [
      "apps/tasks/README.md",
      "apps/notes/README.md",
      "apps/contacts/README.md",
      "apps/links/README.md",
    ]) {
      const readme = readRepoFile(relativePath);
      expect(readme, relativePath).toContain("save-first");
      expect(readme, relativePath).toMatch(/first save|insert on first save/i);
      expect(readme, relativePath).toContain("formMode");
      expect(readme, relativePath).not.toContain("open-first");
      expect(readme, relativePath).not.toContain("persist-on-open");
      expect(readme, relativePath).not.toMatch(
        /persist a draft row immediately, then open/i
      );
      expect(readme, relativePath).not.toMatch(/persists in the background/i);
    }
  });

  it("E2EE zone llms.txt summaries describe save-first create, not draft-row persist", () => {
    for (const relativePath of [
      "apps/tasks/public/llms.txt",
      "apps/notes/public/llms.txt",
      "apps/contacts/public/llms.txt",
      "apps/links/public/llms.txt",
    ]) {
      const llms = readRepoFile(relativePath);
      expect(llms, relativePath).toMatch(/save-first/i);
      expect(llms, relativePath).not.toMatch(/draft row/i);
      expect(llms, relativePath).not.toMatch(/persist-on-open/i);
      expect(llms, relativePath).not.toMatch(/closing without edits removes/i);
    }
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
      expect(readme).toContain("sonner");
      expect(readme).toContain("getE2eeHookErrorMessage");
      expect(readme).not.toMatch(/\| `@helvety\/ui`[^\n]*@helvety\/ui\/sonner/);
      expect(readme).not.toMatch(/local fork/i);
    } catch {
      // Sibling extension repo optional in some checkouts.
    }
  });
});
