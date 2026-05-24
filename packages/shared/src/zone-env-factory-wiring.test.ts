import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const SERVER_UPSTASH_APPS = [
  "auth",
  "contacts",
  "docs",
  "links",
  "notes",
  "store",
  "tasks",
] as const;

describe("zone lib/env factory wiring", () => {
  it.each(SERVER_UPSTASH_APPS)(
    "apps/%s/lib/env.ts uses createAppServerUpstashEnv",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "lib/env.ts"),
        "utf8"
      );
      expect(src).toContain("createAppServerUpstashEnv");
      expect(src).toMatch(/export const getValidated\w+Env/);
    }
  );

  it.each(["pdf", "image-upscaler"] as const)(
    "apps/%s/lib/env.ts uses validateCookieSigningEnv",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "lib/env.ts"),
        "utf8"
      );
      expect(src).toContain("validateCookieSigningEnv");
    }
  );
});
