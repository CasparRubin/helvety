import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_POSTCSS_CONFIG,
  UI_TAILWIND_BUILD_DEPENDENCIES,
  validatePostcssZoneApps,
  validateUiTailwindBuildDependencies,
} from "../../../scripts/postcss-app-expectations.mjs";

const testDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");

describe("postcss and Tailwind build consistency", () => {
  it("matches validatePostcssZoneApps guardrail (all zone apps with postcss.config.mjs)", async () => {
    const errors = await validatePostcssZoneApps(repoRoot);
    expect(errors).toEqual([]);
  });

  it("packages/ui declares production Tailwind build dependencies", async () => {
    const uiManifest = JSON.parse(
      await readFile(resolve(repoRoot, "packages/ui/package.json"), "utf8")
    ) as { dependencies?: Record<string, string> };
    expect(validateUiTailwindBuildDependencies(uiManifest)).toEqual([]);
    expect(uiManifest.dependencies?.tailwindcss).toBe(
      UI_TAILWIND_BUILD_DEPENDENCIES.tailwindcss
    );
    expect(uiManifest.dependencies?.["@tailwindcss/postcss"]).toBe(
      UI_TAILWIND_BUILD_DEPENDENCIES["@tailwindcss/postcss"]
    );
    expect(uiManifest.dependencies?.shadcn).toBe(
      UI_TAILWIND_BUILD_DEPENDENCIES.shadcn
    );
  });

  it("canonical postcss.config.mjs is unchanged", () => {
    expect(CANONICAL_POSTCSS_CONFIG).toBe(
      'export { default } from "@helvety/config/postcss";\n'
    );
  });

  it("quality baseline documents UI production Tailwind PostCSS resolution", async () => {
    const source = await readFile(
      resolve(repoRoot, "docs/quality-modernization-baseline.md"),
      "utf8"
    );
    expect(source).toContain("@tailwindcss/postcss");
    expect(source).toMatch(/@helvety\/ui[\s\S]*production.*tailwindcss/i);
  });

  it("vercel monorepo doc documents PostCSS resolution via @helvety/ui", async () => {
    const source = await readFile(
      resolve(repoRoot, "docs/vercel-monorepo-apps.md"),
      "utf8"
    );
    expect(source).toContain("Tailwind / PostCSS at build time");
    expect(source).toContain("@helvety/ui");
    expect(source).toContain("@tailwindcss/postcss");
  });

  it("root README and package READMEs document the UI production Tailwind exception", async () => {
    const rootReadme = await readFile(resolve(repoRoot, "README.md"), "utf8");
    const uiReadme = await readFile(
      resolve(repoRoot, "packages/ui/README.md"),
      "utf8"
    );
    const devDepsReadme = await readFile(
      resolve(repoRoot, "packages/dev-deps/README.md"),
      "utf8"
    );

    expect(rootReadme).toMatch(
      /packages\/ui\/[\s\S]*@tailwindcss\/postcss|@tailwindcss\/postcss[\s\S]*packages\/ui/
    );
    expect(uiReadme).toContain("## Styling / Tailwind");
    expect(uiReadme).toContain("@tailwindcss/postcss");
    expect(devDepsReadme).toMatch(/@helvety\/ui[\s\S]*@tailwindcss\/postcss/);
  });

  it("app consistency checklist does not imply apps declare Tailwind packages directly", async () => {
    const source = await readFile(
      resolve(repoRoot, "docs/app-consistency-checklist.md"),
      "utf8"
    );
    expect(source).toMatch(/UI carries production `tailwindcss`/);
    expect(source).toMatch(
      /Do not.*duplicate toolchain packages pinned in `@helvety\/dev-deps`/
    );
  });

  it("ui-shadcn policy references shared PostCSS and Vercel resolution", async () => {
    const source = await readFile(
      resolve(repoRoot, "docs/ui-shadcn-integration-policy.md"),
      "utf8"
    );
    expect(source).toContain("@helvety/config/postcss");
    expect(source).toContain("vercel-monorepo-apps.md");
  });
});
