import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Production modules that persist Supabase auth session cookies. */
const SESSION_MUTATION_MODULES = [
  "packages/shared/src/auth-callback.ts",
  "apps/auth/app/actions/otp-actions.ts",
  "apps/auth/app/actions/passkey-auth-actions.ts",
  "apps/auth/app/logout/logout-actions.ts",
  "apps/store/app/actions/account-actions.ts",
] as const;

const MUTATING_CLIENT_IMPORT =
  /from\s+["'](?:@helvety\/shared\/supabase\/server|\.\/supabase\/server)["']/;

const MUTATING_CLIENT_USAGE = /createServerMutatingClient/;

describe("zone supabase session mutation wiring", () => {
  it.each(SESSION_MUTATION_MODULES)(
    "%s imports and uses createServerMutatingClient for session mutations",
    (relativePath) => {
      const src = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(src).toMatch(MUTATING_CLIENT_IMPORT);
      expect(src).toMatch(MUTATING_CLIENT_USAGE);
      expect(src).not.toMatch(
        /await\s+createServerClient\s*\(\)[\s\S]{0,400}\.auth\.(verifyOtp|exchangeCodeForSession|signOut|updateUser)\s*\(/
      );
    }
  );
});
