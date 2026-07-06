import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** Reads a repo file relative to the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("E2EE entity encryption wiring", () => {
  it("contact link hooks decrypt with per-column context", () => {
    for (const relativePath of [
      "apps/tasks/hooks/use-contact-links.ts",
      "apps/links/hooks/use-contact-links.ts",
    ]) {
      const src = readRepoFile(relativePath);
      expect(src).toContain("decryptEntityField");
    }
  });
});
