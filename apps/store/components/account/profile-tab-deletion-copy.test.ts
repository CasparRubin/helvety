import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentDir = dirname(fileURLToPath(import.meta.url));
const profileTabPath = join(componentDir, "profile-tab.tsx");

describe("profile-tab account copy", () => {
  it("lists Links and Docs in the account deletion bullet list", () => {
    const src = readFileSync(profileTabPath, "utf8");

    expect(src).toContain("Delete link data (Helvety Links)");
    expect(src).toContain("Delete document data (Helvety Docs)");
  });

  it("export guidance mentions Links and Docs access paths", () => {
    const src = readFileSync(profileTabPath, "utf8");

    expect(src).toContain("Helvety Links");
    expect(src).toMatch(/Helvety Docs vault/i);
  });
});
