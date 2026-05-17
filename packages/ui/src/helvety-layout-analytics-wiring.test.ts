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
  "image-upscaler",
] as const;

const E2EE_SHELL_APPS = ["tasks", "contacts", "notes", "links"] as const;

const ALL_SHELL_APPS = [...PUBLIC_SHELL_APPS, ...E2EE_SHELL_APPS] as const;

/** Reads a UTF-8 source file from `apps/<app>/`. */
function readAppFile(app: string, relativePath: string): string {
  return readFileSync(join(repoRoot, "apps", app, relativePath), "utf8");
}

describe("Helvety layout analytics wiring", () => {
  it.each(PUBLIC_SHELL_APPS)(
    "apps/%s uses HelvetyPublicShellRootLayout",
    (app) => {
      const src = readAppFile(app, "app/layout.tsx");
      expect(src).toContain("HelvetyPublicShellRootLayout");
      expect(src).not.toMatch(/from ["']@vercel\/analytics/);
    }
  );

  it.each(E2EE_SHELL_APPS)("apps/%s uses E2eeAppRootLayout", (app) => {
    const src = readAppFile(app, "app/layout.tsx");
    expect(src).toContain("E2eeAppRootLayout");
    expect(src).not.toMatch(/from ["']@vercel\/analytics/);
  });

  it("shared shells mount HelvetyVercelAnalytics wrappers", () => {
    const publicShell = readFileSync(
      join(repoRoot, "packages/ui/src/helvety-public-shell-root-layout.tsx"),
      "utf8"
    );
    const e2eeShell = readFileSync(
      join(repoRoot, "packages/ui/src/e2ee-app-root-layout.tsx"),
      "utf8"
    );
    const analyticsModule = readFileSync(
      join(repoRoot, "packages/ui/src/vercel-analytics.tsx"),
      "utf8"
    );

    expect(publicShell).toContain("HelvetyVercelAnalytics");
    expect(e2eeShell).toContain("HelvetyVercelAnalytics");
    expect(publicShell).not.toMatch(/from ["']@vercel\/analytics/);
    expect(e2eeShell).not.toMatch(/from ["']@vercel\/analytics/);
    expect(analyticsModule).toContain("isHelvetyVercelAnalyticsEnabled");
    expect(analyticsModule).toContain("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS");
  });

  it.each(ALL_SHELL_APPS)(
    "apps/%s env.template documents analytics opt-out",
    (app) => {
      const src = readAppFile(app, "env.template");
      expect(src).toContain("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS");
    }
  );
});
