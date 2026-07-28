import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  HELVETY_FORBIDDEN_ANALYTICS_CODE_MARKERS,
  HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS,
} from "@helvety/shared/analytics-guardrails";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PUBLIC_SHELL_APPS = [
  "web",
  "store",
  "pdf",
  "image-editor",
  "ocr",
] as const;

/** Reads a UTF-8 source file from `apps/<app>/`. */
function readAppFile(app: string, relativePath: string): string {
  return readFileSync(join(repoRoot, "apps", app, relativePath), "utf8");
}

/** Asserts layout/shell sources do not reference removed analytics packages or env keys. */
function assertNoAnalyticsMarkers(
  src: string,
  label: string,
  markers: readonly string[] = HELVETY_FORBIDDEN_ANALYTICS_CODE_MARKERS
): void {
  for (const marker of markers) {
    expect(src, `${label} must not contain ${marker}`).not.toContain(marker);
  }
  for (const envKey of HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS) {
    expect(src, `${label} must not reference ${envKey}`).not.toContain(envKey);
  }
}

describe("Helvety layout wiring", () => {
  it("covers remaining Helvety web zones that use shared root shells", () => {
    expect(PUBLIC_SHELL_APPS).toHaveLength(5);
  });

  it.each(PUBLIC_SHELL_APPS)(
    "apps/%s uses HelvetyPublicShellRootLayout",
    (app) => {
      const src = readAppFile(app, "app/layout.tsx");
      expect(src).toContain("HelvetyPublicShellRootLayout");
    }
  );

  it.each(PUBLIC_SHELL_APPS)(
    "apps/%s root layout does not wire third-party analytics",
    (app) => {
      const layout = readAppFile(app, "app/layout.tsx");
      expect(layout).not.toMatch(/\banalytics\s*=/);
      assertNoAnalyticsMarkers(layout, `apps/${app}/app/layout.tsx`);
    }
  );

  it("shared @helvety/ui shells and package exports do not wire third-party analytics", () => {
    const publicShell = readFileSync(
      join(repoRoot, "packages/ui/src/helvety-public-shell-root-layout.tsx"),
      "utf8"
    );
    const uiPackage = readFileSync(
      join(repoRoot, "packages/ui/package.json"),
      "utf8"
    );

    assertNoAnalyticsMarkers(
      publicShell,
      "helvety-public-shell-root-layout.tsx"
    );
    assertNoAnalyticsMarkers(uiPackage, "packages/ui/package.json");
  });

  it("public shell ScrollArea selectors target data-slot=scroll-area-viewport", () => {
    const publicShell = readFileSync(
      join(repoRoot, "packages/ui/src/helvety-public-shell-root-layout.tsx"),
      "utf8"
    );
    expect(publicShell).toContain("data-slot=scroll-area-viewport");
  });
});
