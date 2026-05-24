import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("web gateway root layout shell providers", () => {
  it("uses HelvetyPublicShellRootLayout with public session bootstrap and no layout-level WebGL import", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).not.toContain("@helvety/light-pillar");
    expect(src).not.toContain("HelvetyShellWithLightPillarBackdrop");
    expect(src).toContain("<HelvetyPublicShellRootLayout");
    expect(src).not.toMatch(/return\s+HelvetyPublicShellRootLayout\s*\(/);
    expect(src).toContain("bootstrapPublicLayoutUser");
  });
});
