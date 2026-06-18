import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const privacyPagePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "privacy",
  "page.tsx"
);

describe("privacy policy responsive tables", () => {
  it("uses LegalTableWrap and shadcn Table instead of legacy markup", () => {
    const src = readFileSync(privacyPagePath, "utf8");

    expect(src).toContain("LegalTableWrap");
    expect(src).toContain('layout="scroll"');
    expect(src).toContain('layout="cards"');
    expect(src).toContain("@helvety/ui/table");
    expect(src).not.toMatch(/<table className="border-border/);
    expect(src).not.toContain("overflow-x-auto");
  });

  it("labels cookie table cells for mobile card layout", () => {
    const src = readFileSync(privacyPagePath, "utf8");
    const cookiesSection = src.slice(src.indexOf('id="cookies"'));

    expect(cookiesSection).toContain('data-label="Cookie / Storage"');
    expect(cookiesSection).toContain('data-label="Purpose"');
    expect(cookiesSection).toContain('data-label="Domain"');
    expect(cookiesSection).toContain('data-label="Duration"');
  });
});
