import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { E2EE_APP_PAGE_PATHS } from "./e2ee-page-auth";

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

describe("E2EE app Server Component auth guards", () => {
  it("each E2EE product page calls requireE2eeAppPageAuth with its public path", () => {
    for (const publicPath of E2EE_APP_PAGE_PATHS) {
      const slug = publicPath.slice(1);
      const pagePath = join(repoRoot, "apps", slug, "app", "page.tsx");
      const source = readFileSync(pagePath, "utf8");
      expect(source, pagePath).toContain("requireE2eeAppPageAuth");
      expect(source, pagePath).toContain(JSON.stringify(publicPath));
    }
  });
});
