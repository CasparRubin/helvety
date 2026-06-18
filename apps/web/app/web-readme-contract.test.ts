import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(webRoot, "README.md");

describe("apps/web README contracts", () => {
  it("documents pathname-scoped shell overflow and legal table primitives", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toContain("getGatewayShellLayoutProps");
    expect(readme).toContain("x-helvety-pathname");
    expect(readme).toContain("includeRequestPathname");
    expect(readme).toMatch(/only on `\/`/);
    expect(readme).toContain("LegalTableWrap");
    expect(readme).not.toMatch(
      /The gateway passes `scrollAreaViewportClassName` with `bg-background` so the scroll column/
    );
  });
});
