import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

/**
 * Contract for gateway shell scroll viewport: hero bleed is scoped to `/` via
 * {@link getGatewayShellLayoutProps} (see layout.tsx).
 */
describe("web root layout shell props", () => {
  it("derives shell overflow props from getGatewayShellLayoutProps", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain("getGatewayShellLayoutProps");
    expect(src).toContain("{...shellLayoutProps}");
    expect(src).not.toMatch(
      /scrollAreaViewportClassName[=:]\s*["']!overflow-visible bg-background["']/
    );
  });

  it("documents head theme init for correct tokens before body paint", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain("HelvetyThemeInitScript");
    expect(src).toContain("in `<head>`");
  });
});
