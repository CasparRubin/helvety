import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("pdf root layout shell providers", () => {
  it("uses HelvetyPublicShellRootLayout without a WebGL backdrop in the layout", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).not.toContain("@helvety/light-pillar");
    expect(src).not.toContain("HelvetyShellWithLightPillarBackdrop");
    expect(src).toContain("HelvetyPublicShellRootLayout");
    expect(src).toContain("bootstrapPublicLayoutUser");
  });
});
