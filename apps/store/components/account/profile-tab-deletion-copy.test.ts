import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const componentDir = dirname(fileURLToPath(import.meta.url));
const profileTabPath = join(componentDir, "profile-tab.tsx");

describe("profile-tab account copy", () => {
  it("lists Links in the account deletion bullet list", () => {
    const src = readFileSync(profileTabPath, "utf8");

    expect(src).toContain("Delete link data (Helvety Links)");
  });

  it("export guidance mentions Links access paths", () => {
    const src = readFileSync(profileTabPath, "utf8");

    expect(src).toContain("Helvety Links");
  });
});
