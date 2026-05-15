import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("auth root layout shell backdrop", () => {
  it("imports HelvetyShellWithLightPillarBackdrop inside EncryptionProvider", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain(
      'import { HelvetyShellWithLightPillarBackdrop } from "@helvety/light-pillar"'
    );
    expect(src).toContain("<HelvetyShellWithLightPillarBackdrop>");
    expect(src).toContain("<EncryptionProvider>");
    expect(src).toContain("<CSRFProvider csrfToken={csrfToken}>");
    expect(src).toContain("wrapInsideTooltipProvider");

    const csrfOpen = src.indexOf("<CSRFProvider");
    const encryptionOpen = src.indexOf("<EncryptionProvider>");
    const shellOpen = src.indexOf("<HelvetyShellWithLightPillarBackdrop>");
    const encryptionClose = src.lastIndexOf("</EncryptionProvider>");
    const csrfClose = src.lastIndexOf("</CSRFProvider>");

    expect(encryptionOpen).toBeGreaterThan(csrfOpen);
    expect(shellOpen).toBeGreaterThan(encryptionOpen);
    expect(shellOpen).toBeLessThan(encryptionClose);
    expect(encryptionClose).toBeLessThan(csrfClose);
  });
});
