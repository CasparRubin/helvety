import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");
const vaultSheetPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../components/vault-documents-sheet.tsx"
);

describe("docs hybrid routing", () => {
  it("main page stays public and does not require full-app E2EE gate", () => {
    const src = readFileSync(pagePath, "utf8");
    expect(src).toContain("bootstrapPublicLayoutUser");
    expect(src).not.toContain("requireE2eeAppPageAuth");
    expect(src).not.toContain("EncryptionGateApp");
    expect(src).toMatch(/starts blank|Editor starts blank/i);
  });

  it("scopes EncryptionGateApp to the vault sheet only", () => {
    const src = readFileSync(vaultSheetPath, "utf8");
    expect(src).toContain("EncryptionGateApp");
  });
});
