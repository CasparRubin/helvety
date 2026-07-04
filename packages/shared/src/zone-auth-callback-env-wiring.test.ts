import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const AUTH_CALLBACK_APPS = [
  "auth",
  "contacts",
  "image-upscaler",
  "image-editor",
  "links",
  "notes",
  "pdf",
  "store",
  "tasks",
] as const;

const UPSTASH_ENV_FACTORY_PATTERNS = [
  "createAppServerUpstashEnv",
  "createAppUserScopedE2eeEnv",
  "createAppUpstashCookieEnv",
] as const;

/** Apps with auth callback routes must validate Upstash at startup (strict rate limiting). */
describe("zone auth callback env wiring", () => {
  it.each(AUTH_CALLBACK_APPS)(
    "apps/%s with auth/callback requires Upstash env factory",
    (app) => {
      const callbackPath = join(
        repoRoot,
        "apps",
        app,
        "app/auth/callback/route.ts"
      );
      expect(existsSync(callbackPath)).toBe(true);

      const envSrc = readFileSync(
        join(repoRoot, "apps", app, "lib/env.ts"),
        "utf8"
      );
      const usesUpstashFactory = UPSTASH_ENV_FACTORY_PATTERNS.some((pattern) =>
        envSrc.includes(pattern)
      );
      expect(usesUpstashFactory).toBe(true);
    }
  );
});
