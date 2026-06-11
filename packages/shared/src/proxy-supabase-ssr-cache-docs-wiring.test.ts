import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const DOC_PATHS = [
  "README.md",
  "packages/shared/README.md",
  "docs/app-consistency-checklist.md",
  "docs/dependency-inventory.md",
  "docs/security-review-runbook.md",
] as const;

/** Maintainer docs must describe @supabase/ssr 0.12+ cache headers on session refresh. */
const SSR_CACHE_HEADER_DOC_PATTERNS = [
  /@supabase\/ssr.*0\.12|0\.12\+.*@supabase\/ssr/i,
  /cache header|Cache-Control/i,
  /setAll/i,
];

describe("proxy supabase ssr cache header docs wiring", () => {
  it("refresh and security proxy apply @supabase/ssr setAll cache headers", () => {
    const refreshSrc = readFileSync(
      join(
        repoRoot,
        "packages/shared/src/supabase/refresh-auth-session-in-proxy.ts"
      ),
      "utf8"
    );
    const proxySrc = readFileSync(
      join(repoRoot, "packages/shared/src/proxy.ts"),
      "utf8"
    );

    expect(refreshSrc).toContain("setAll(cookiesToSet, headers)");
    expect(refreshSrc).toContain("SUPABASE_AUTH_REFRESH_RESPONSE_HEADERS");
    expect(proxySrc).toContain("copySupabaseAuthRefreshResponseHeaders");
  });

  it.each(DOC_PATHS)(
    "%s documents SSR cache headers on auth refresh",
    (relPath) => {
      const text = readFileSync(join(repoRoot, relPath), "utf8");
      for (const pattern of SSR_CACHE_HEADER_DOC_PATTERNS) {
        expect(text, `${relPath} must match ${pattern}`).toMatch(pattern);
      }
    }
  );
});
