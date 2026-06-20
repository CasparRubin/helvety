import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** Reads a repo file relative to the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const ENTITY_CRYPTO_MODULES = [
  "apps/contacts/lib/crypto/contact-encryption.ts",
  "apps/tasks/lib/crypto/task-encryption.ts",
  "apps/notes/lib/crypto/note-encryption.ts",
  "apps/links/lib/crypto/link-encryption.ts",
  "apps/links/lib/crypto/link-folder-encryption.ts",
  "apps/docs/lib/crypto/doc-encryption.ts",
] as const;

describe("E2EE entity encryption wiring", () => {
  it.each(ENTITY_CRYPTO_MODULES)(
    "%s uses field-bound encryptEntityField/decryptEntityField",
    (relativePath) => {
      const src = readRepoFile(relativePath);
      expect(src).toContain("encryptEntityField");
      expect(src).toContain("decryptEntityField");
      expect(src).not.toMatch(/\bawait\s+encrypt\s*\(/);
      expect(src).not.toMatch(/\bawait\s+decrypt\s*\(/);
      expect(src).not.toMatch(/\bbuildAAD\s*\(/);
    }
  );

  it("contact link hooks decrypt with per-column context", () => {
    for (const relativePath of [
      "apps/tasks/hooks/use-contact-links.ts",
      "apps/links/hooks/use-contact-links.ts",
    ]) {
      const src = readRepoFile(relativePath);
      expect(src).toContain("decryptEntityField");
      expect(src).not.toMatch(/\bawait\s+decrypt\s*\(/);
    }
  });
});
