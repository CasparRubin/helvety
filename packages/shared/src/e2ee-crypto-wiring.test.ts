import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

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
] as const;

describe("E2EE app crypto wiring", () => {
  it.each(ENTITY_CRYPTO_MODULES)(
    "%s delegates to @helvety/shared/crypto/e2ee-entity-crypto",
    (relativePath) => {
      const src = readRepoFile(relativePath);
      expect(src).toContain("@helvety/shared/crypto/e2ee-entity-crypto");
    }
  );

  it.each(ENTITY_CRYPTO_MODULES)(
    "%s does not call encryptEntityField directly",
    (relativePath) => {
      const src = readRepoFile(relativePath);
      expect(src).not.toContain("encryptEntityField");
    }
  );

  it.each(ENTITY_CRYPTO_MODULES)(
    "%s does not call decryptEntityField directly",
    (relativePath) => {
      const src = readRepoFile(relativePath);
      expect(src).not.toContain("decryptEntityField");
    }
  );

  it.each(ENTITY_CRYPTO_MODULES)(
    "%s does not call raw low-level encrypt/decrypt",
    (relativePath) => {
      const src = readRepoFile(relativePath);
      expect(src).not.toMatch(/\bawait\s+encrypt\s*\(/);
      expect(src).not.toMatch(/\bawait\s+decrypt\s*\(/);
    }
  );
});
