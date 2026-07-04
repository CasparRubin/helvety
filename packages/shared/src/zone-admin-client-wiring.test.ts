import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const ADMIN_TIER_APPS = ["auth", "store"] as const;

const VAULT_USER_SCOPED_APPS = ["contacts", "links", "notes", "tasks"] as const;

const PUBLIC_TOOL_APPS = ["pdf", "image-upscaler", "image-editor"] as const;

const NON_ADMIN_APPS = [
  ...VAULT_USER_SCOPED_APPS,
  ...PUBLIC_TOOL_APPS,
] as const;

const ADMIN_CLIENT_IMPORT = /from\s+["']@helvety\/shared\/supabase\/admin["']/;

/** Collect production `.ts`/`.tsx` files under an app, excluding tests. */
function listProductionSourceFiles(app: string): string[] {
  const appDir = join(repoRoot, "apps", app);
  const files: string[] = [];

  /** Recursively collects non-test TypeScript sources under `dir`. */
  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      const stat = statSync(absolute);
      if (stat.isDirectory()) {
        if (entry === "node_modules" || entry === ".next") {
          continue;
        }
        walk(absolute);
        continue;
      }
      if (
        (absolute.endsWith(".ts") || absolute.endsWith(".tsx")) &&
        !absolute.endsWith(".test.ts") &&
        !absolute.endsWith(".test.tsx")
      ) {
        files.push(absolute);
      }
    }
  }

  walk(appDir);
  return files;
}

/** Returns true when an app imports `@helvety/shared/supabase/admin` in production code. */
function appUsesAdminClient(app: string): boolean {
  return listProductionSourceFiles(app).some((file) =>
    ADMIN_CLIENT_IMPORT.test(readFileSync(file, "utf8"))
  );
}

describe("zone admin client usage wiring", () => {
  it.each(ADMIN_TIER_APPS)(
    "apps/%s uses createAdminClient or createScopedAdminQuery",
    (app) => {
      expect(appUsesAdminClient(app)).toBe(true);
    }
  );

  it.each(NON_ADMIN_APPS)(
    "apps/%s does not import @helvety/shared/supabase/admin in production code",
    (app) => {
      expect(appUsesAdminClient(app)).toBe(false);
    }
  );
});
