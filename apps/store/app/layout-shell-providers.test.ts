import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("store root layout shell providers", () => {
  it("uses HelvetyPublicShellRootLayout without retired providers", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).toContain("<HelvetyPublicShellRootLayout");
    expect(src).not.toContain("CSRFProvider");
    expect(src).not.toContain("bootstrapE2eeLayoutSession");
    expect(src).not.toContain("wrapInsideTooltipProvider");
    expect(src).toContain("renderNavbar={<Navbar />}");
    expect(src).toContain("scrollAreaMainPrefix={<StoreNav />}");
  });
});
