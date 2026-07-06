import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

/**
 * Contract for gateway shell props passed from the root layout.
 */
describe("web root layout shell props", () => {
  it("passes the static shell props inline", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain('bodyClassName="overflow-x-clip"');
  });

  it("documents head theme init for correct tokens before body paint", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain("HelvetyThemeInitScript");
    expect(src).toContain("in `<head>`");
  });
});
