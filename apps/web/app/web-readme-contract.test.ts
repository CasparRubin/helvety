import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(webRoot, "README.md");

describe("apps/web README contracts", () => {
  it("documents the gateway hero shell and legal table primitives", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toContain("`bg-background`");
    expect(readme).toContain("Made in Switzerland");
    expect(readme).toContain("HeroMarketingShell");
    expect(readme).toContain("LegalTableWrap");
    expect(readme).not.toMatch(
      /The gateway passes `scrollAreaViewportClassName` with `bg-background` so the scroll column/
    );
  });
});
