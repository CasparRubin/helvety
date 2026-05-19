import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const hyperspeedPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "Hyperspeed.tsx"
);

describe("Hyperspeed timer API", () => {
  it("uses THREE.Timer instead of deprecated THREE.Clock", () => {
    const src = readFileSync(hyperspeedPath, "utf8");
    expect(src).toContain("THREE.Timer");
    expect(src).toContain("timer.update(time)");
    expect(src).toContain("timer.getDelta()");
    expect(src).not.toContain("THREE.Clock");
    expect(src).not.toContain("this.clock");
  });

  it("passes rAF timestamp into the animation loop", () => {
    const src = readFileSync(hyperspeedPath, "utf8");
    expect(src).toMatch(/tick\s*\(\s*time\s*:\s*number\s*\)/);
    expect(src).toContain("requestAnimationFrame(this.tick)");
  });
});
