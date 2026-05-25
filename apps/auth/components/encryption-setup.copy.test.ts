import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("encryption-setup copy", () => {
  it("mentions every E2EE app path including links and Docs vault", () => {
    const source = readFileSync(
      join(repoRoot, "apps/auth/components/encryption-setup.tsx"),
      "utf8"
    );
    expect(source).toContain("helvety.com/tasks");
    expect(source).toContain("helvety.com/contacts");
    expect(source).toContain("helvety.com/notes");
    expect(source).toContain("helvety.com/links");
    expect(source).toMatch(/Docs optional vault save/i);
  });
});
