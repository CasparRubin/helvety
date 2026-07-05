import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("encryption-setup copy", () => {
  it("mentions every E2EE app path including links", () => {
    const source = readFileSync(
      join(repoRoot, "apps/auth/components/encryption-setup.tsx"),
      "utf8"
    );
    expect(source).toContain("helvety.com/tasks");
    expect(source).toContain("helvety.com/contacts");
    expect(source).toContain("helvety.com/notes");
    expect(source).toContain("helvety.com/links");
  });

  it("does not describe registration PRF failures as legacy crypto fallback", () => {
    const source = readFileSync(
      join(repoRoot, "apps/auth/components/encryption-setup.tsx"),
      "utf8"
    );
    expect(source).not.toMatch(/will use fallback/i);
    expect(source).not.toMatch(/Non-fatal:/i);
    expect(source).toContain("EncryptionGate will prompt for unlock");
  });
});
