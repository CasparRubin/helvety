import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PUBLIC_SHELL_APPS = [
  "web",
  "auth",
  "store",
  "pdf",
  "docs",
  "image-upscaler",
] as const;

const E2EE_SHELL_APPS = ["tasks", "contacts", "notes", "links"] as const;

const ALL_SHELL_APPS = [...PUBLIC_SHELL_APPS, ...E2EE_SHELL_APPS] as const;

/** Reads a UTF-8 source file from `apps/<app>/`. */
function readAppFile(app: string, relativePath: string): string {
  return readFileSync(join(repoRoot, "apps", app, relativePath), "utf8");
}

describe("Helvety layout wiring", () => {
  it("covers all ten Helvety web zones that use shared root shells", () => {
    expect(ALL_SHELL_APPS).toHaveLength(10);
    expect([...PUBLIC_SHELL_APPS, ...E2EE_SHELL_APPS]).toEqual([
      ...ALL_SHELL_APPS,
    ]);
  });

  it.each(PUBLIC_SHELL_APPS)(
    "apps/%s uses HelvetyPublicShellRootLayout",
    (app) => {
      const src = readAppFile(app, "app/layout.tsx");
      expect(src).toContain("HelvetyPublicShellRootLayout");
    }
  );

  it.each(["auth", "store"] as const)(
    "apps/%s does not mount an animated WebGL shell backdrop",
    (app) => {
      const src = readAppFile(app, "app/layout.tsx");
      expect(src).not.toContain("@helvety/light-pillar");
      expect(src).not.toContain("HelvetyShellWithLightPillarBackdrop");
    }
  );

  it.each(E2EE_SHELL_APPS)("apps/%s uses E2eeAppRootLayout", (app) => {
    const src = readAppFile(app, "app/layout.tsx");
    expect(src).toContain("E2eeAppRootLayout");
  });

  it("gateway layout does not pass analytics props", () => {
    const webLayout = readAppFile("web", "app/layout.tsx");
    expect(webLayout).not.toMatch(/\banalytics\s*=/);
    expect(webLayout).not.toContain("with-speed-insights");
  });

  it("shared shells and @helvety/ui do not wire Vercel analytics", () => {
    const publicShell = readFileSync(
      join(repoRoot, "packages/ui/src/helvety-public-shell-root-layout.tsx"),
      "utf8"
    );
    const e2eeShell = readFileSync(
      join(repoRoot, "packages/ui/src/e2ee-app-root-layout.tsx"),
      "utf8"
    );
    const uiPackage = readFileSync(
      join(repoRoot, "packages/ui/package.json"),
      "utf8"
    );
    const nextConfig = readFileSync(
      join(repoRoot, "apps/web/next.config.ts"),
      "utf8"
    );

    for (const src of [publicShell, e2eeShell, uiPackage, nextConfig]) {
      expect(src).not.toMatch(/from ["']@vercel\/analytics/);
      expect(src).not.toMatch(/from ["']@vercel\/speed-insights/);
      expect(src).not.toContain("HelvetyVercelAnalytics");
      expect(src).not.toContain("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS");
      expect(src).not.toContain("zone-analytics-referer");
    }

    expect(uiPackage).not.toContain('"./vercel-analytics"');
    expect(uiPackage).not.toContain('"@vercel/analytics"');
    expect(uiPackage).not.toContain('"@vercel/speed-insights"');
    expect(nextConfig).not.toContain("analyticsId");
    expect(nextConfig).not.toContain("script.js");
  });
});
