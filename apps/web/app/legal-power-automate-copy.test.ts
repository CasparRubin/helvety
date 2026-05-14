import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** `apps/web/app/` */
const appDir = dirname(fileURLToPath(import.meta.url));

describe("Power Automate legal copy (extension Survey tab parity)", () => {
  const officialTitle = "Power Automate Editor Version Enforcer";

  it("privacy page uses Survey tab, not legacy Feedback tab label", () => {
    const privacy = readFileSync(join(appDir, "privacy", "page.tsx"), "utf8");
    expect(privacy).toContain("Survey tab");
    expect(privacy).not.toContain("Feedback tab");
    expect(privacy).toContain(officialTitle);
  });

  it("impressum uses Survey tab for v3survey handling", () => {
    const impressum = readFileSync(
      join(appDir, "impressum", "page.tsx"),
      "utf8"
    );
    expect(impressum).toContain("Survey tab");
    expect(impressum).not.toContain("Feedback tab");
    expect(impressum).toContain(officialTitle);
  });
});
