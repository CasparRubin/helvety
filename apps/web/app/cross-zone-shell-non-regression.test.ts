import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const footerPath = join(repoRoot, "packages/ui/src/footer.tsx");
const gatewayShellPropsPath = join(
  repoRoot,
  "apps/web/lib/gateway-shell-props.ts"
);
const webLayoutPath = join(repoRoot, "apps/web/app/layout.tsx");

const OTHER_ZONE_LAYOUTS = [
  "apps/auth/app/layout.tsx",
  "apps/store/app/layout.tsx",
  "apps/pdf/app/layout.tsx",
  "apps/docs/app/layout.tsx",
  "apps/image-upscaler/app/layout.tsx",
] as const;

describe("cross-zone shell non-regression", () => {
  it("does not add global footer stacking overrides", () => {
    const footer = readFileSync(footerPath, "utf8");
    expect(footer).not.toMatch(/\bz-10\b/);
  });

  it("keeps overflow-visible shell bleed scoped to the web gateway only", () => {
    const layout = readFileSync(webLayoutPath, "utf8");
    expect(layout).not.toContain("overflow-visible");

    const gatewayShellProps = readFileSync(gatewayShellPropsPath, "utf8");
    expect(gatewayShellProps).toContain("!overflow-visible");

    for (const relativePath of OTHER_ZONE_LAYOUTS) {
      const src = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(
        src,
        `${relativePath} must not opt into Hyperspeed overflow-visible shell props`
      ).not.toContain("overflow-visible");
    }
  });
});
