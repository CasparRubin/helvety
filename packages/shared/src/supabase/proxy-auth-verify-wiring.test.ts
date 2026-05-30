import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** Source of {@link refresh-auth-session-in-proxy.ts} for static auth contract checks. */
function readRefreshAuthSessionSource(): string {
  return readFileSync(
    join(
      repoRoot,
      "packages/shared/src/supabase/refresh-auth-session-in-proxy.ts"
    ),
    "utf8"
  );
}

describe("proxy auth verify wiring", () => {
  it("verifies sessions at the edge with getClaims only (no getUser fallback)", () => {
    const src = readRefreshAuthSessionSource();
    expect(src).toContain("await supabase.auth.getClaims()");
    expect(src).not.toMatch(/auth\.getUser\s*\(/);
    expect(src).not.toContain("typeof auth.getClaims");
  });
});
