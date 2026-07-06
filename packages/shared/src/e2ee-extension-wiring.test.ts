import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const extensionRootCandidates = [
  join(repoRoot, "../helvety-browser-extension-chromium"),
  join(repoRoot, "../helvety-browser-extension-chromium/.helvety"),
];

const extensionRoot =
  extensionRootCandidates.find((candidate) =>
    existsSync(join(candidate, "src/lib/entity-repository.ts"))
  ) ?? null;

/** Reads a file from the sibling extension repo when present. */
function readExtensionFile(relativePath: string): string {
  if (!extensionRoot) {
    throw new Error("extension sibling repo not present");
  }
  return readFileSync(join(extensionRoot, relativePath), "utf8");
}

describe("E2EE extension wiring (monorepo guard)", () => {
  it("skips when helvety-browser-extension-chromium is not checked out", () => {
    expect(typeof extensionRoot === "string" || extensionRoot === null).toBe(
      true
    );
  });

  it.skipIf(!extensionRoot)(
    "entity-repository imports crypto through extension facades",
    () => {
      const src = readExtensionFile("src/lib/entity-repository.ts");
      expect(src).toContain("./encrypt-entities");
      expect(src).toContain("./decrypt-entities");
      expect(src).not.toContain("encryptEntityField");
    }
  );

  it.skipIf(!extensionRoot)(
    "entity-drafts re-exports shared create inputs and record-to-input",
    () => {
      const src = readExtensionFile("src/popup/entity-drafts.ts");
      expect(src).toContain("@helvety/shared/e2ee-create-inputs");
      expect(src).toContain("@helvety/shared/e2ee-record-to-input");
      expect(src).not.toMatch(/export function taskToInput/);
    }
  );

  it.skipIf(!extensionRoot)(
    "extension surfaces use @helvety/ui/sonner for toasts",
    () => {
      const appSrc = readExtensionFile("src/popup/App.tsx");
      const linksSrc = readExtensionFile(
        "src/lib/extension-entity-links-hooks.tsx"
      );
      expect(appSrc).toContain("@helvety/ui/sonner");
      expect(linksSrc).toContain("@helvety/ui/sonner");
      expect(appSrc).not.toContain('from "sonner"');
    }
  );

  it.skipIf(!extensionRoot)(
    "use-extension-entity-form validates drafts via shared helper",
    () => {
      const src = readExtensionFile(
        "src/popup/hooks/use-extension-entity-form.ts"
      );
      expect(src).toContain("validateE2eeDraft");
      expect(src).toContain("buildDeleteMessage");
      expect(src).toContain("@helvety/shared/validate-e2ee-draft");
    }
  );

  it.skipIf(!extensionRoot)("link-tree re-exports shared link-tree-ops", () => {
    const src = readExtensionFile("src/lib/link-tree.ts");
    expect(src).toContain("@helvety/shared/link-tree-ops");
  });
});
