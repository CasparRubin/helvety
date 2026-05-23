import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("docs root layout shell providers", () => {
  it("wraps shell in CSRF and EncryptionProvider without a WebGL backdrop", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).not.toContain("@helvety/light-pillar");
    expect(src).not.toContain("HelvetyShellWithLightPillarBackdrop");
    expect(src).toContain("<CSRFProvider csrfToken={csrfToken}>");
    expect(src).toContain("<EncryptionProvider>");
    expect(src).toContain("wrapInsideTooltipProvider");

    const csrfOpen = src.indexOf("<CSRFProvider");
    const encryptionOpen = src.indexOf("<EncryptionProvider>");
    const encryptionClose = src.lastIndexOf("</EncryptionProvider>");

    expect(csrfOpen).toBeGreaterThan(-1);
    expect(encryptionOpen).toBeGreaterThan(csrfOpen);
    expect(encryptionClose).toBeGreaterThan(encryptionOpen);
  });
});
