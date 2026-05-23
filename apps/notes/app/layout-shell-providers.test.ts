import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("notes root layout shell providers", () => {
  it("uses E2eeAppRootLayout with a local encryption provider and no WebGL backdrop", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).not.toContain("@helvety/light-pillar");
    expect(src).not.toContain("HelvetyShellWithLightPillarBackdrop");
    expect(src).toContain("E2eeAppRootLayout");
    expect(src).toContain("encryptionProvider={EncryptionProvider}");
  });
});
