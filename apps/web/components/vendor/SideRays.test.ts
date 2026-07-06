import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sideRaysPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "SideRays.tsx"
);

describe("SideRays vendor source", () => {
  it("uses OGL and exposes the React Bits top-right origin controls", () => {
    const src = readFileSync(sideRaysPath, "utf8");

    expect(src).toContain('from "ogl"');
    expect(src).toContain('origin = "top-right"');
    expect(src).toContain('case "top-right"');
    expect(src).toContain("onReady?.()");
    expect(src).toContain("onInitError?.()");
  });
});
