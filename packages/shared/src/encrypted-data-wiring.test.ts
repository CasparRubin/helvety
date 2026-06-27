import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const ENCRYPTED_MUTATION_ACTION_FILES = [
  "apps/contacts/app/actions/contact-actions.ts",
  "apps/tasks/app/actions/item-actions.ts",
  "apps/notes/app/actions/item-actions.ts",
  "apps/links/app/actions/link-actions.ts",
  "apps/links/app/actions/folder-actions.ts",
] as const;

describe("EncryptedDataSchema adoption wiring", () => {
  it.each(ENCRYPTED_MUTATION_ACTION_FILES)(
    "%s imports @helvety/shared/validation/encrypted-data",
    (relativePath) => {
      const src = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(src).toContain("@helvety/shared/validation/encrypted-data");
      expect(src).toMatch(/EncryptedDataSchema|createEncryptedDataSchema/);
    }
  );
});
