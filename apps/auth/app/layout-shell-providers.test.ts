import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("auth root layout shell providers", () => {
  it("wraps shell in CSRF and Encryption", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).toContain("bootstrapAuthLayoutSession");
    expect(src).not.toContain("getCachedCSRFToken");
    expect(src).not.toContain("getCachedUser");
    expect(src).toContain("<CSRFProvider csrfToken={csrfToken}>");
    expect(src).toContain("<EncryptionProvider>{shell}</EncryptionProvider>");
    expect(src).toContain('from "@/lib/crypto"');
    expect(src).not.toMatch(
      /import\s*\{[^}]*EncryptionProvider[^}]*\}\s*from\s*"@helvety\/shared\/crypto\/encryption-context"/
    );
    expect(src).toContain("wrapInsideTooltipProvider");

    const csrfOpen = src.indexOf("<CSRFProvider");
    const encryptionOpen = src.indexOf("<EncryptionProvider>");
    const encryptionClose = src.lastIndexOf("</EncryptionProvider>");
    const csrfClose = src.lastIndexOf("</CSRFProvider>");

    expect(encryptionOpen).toBeGreaterThan(csrfOpen);
    expect(encryptionClose).toBeLessThan(csrfClose);
  });
});
