import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const ADMIN_SERVER_UPSTASH_APPS = ["auth", "store"] as const;

const USER_SCOPED_SERVER_APPS = [
  "contacts",
  "docs",
  "links",
  "notes",
  "tasks",
] as const;

const UPSTASH_COOKIE_APPS = ["pdf", "image-upscaler"] as const;

describe("zone lib/env factory wiring", () => {
  it.each(ADMIN_SERVER_UPSTASH_APPS)(
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

  it("apps/auth/lib/env.ts validates HELVETY_CHROME_EXTENSION_ORIGINS", () => {
    const src = readFileSync(
      join(repoRoot, "apps", "auth", "lib/env.ts"),
      "utf8"
    );
    expect(src).toContain("HELVEETY_CHROME_EXTENSION_ORIGINS");
    expect(src).toContain("parseChromeExtensionOriginsEnv");
  });

  it.each(USER_SCOPED_SERVER_APPS)(
    "apps/%s/lib/env.ts uses createAppUserScopedEnv",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "lib/env.ts"),
        "utf8"
      );
      expect(src).toContain("createAppUserScopedEnv");
      expect(src).toMatch(/export const getValidated\w+Env/);
    }
  );

  it.each(UPSTASH_COOKIE_APPS)(
    "apps/%s/lib/env.ts uses createAppUpstashCookieEnv",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "lib/env.ts"),
        "utf8"
      );
      expect(src).toContain("createAppUpstashCookieEnv");
      expect(src).toMatch(/export const getValidated\w+Env/);
    }
  );

  it("apps/web/lib/env.ts uses getValidatedGatewayEnv", () => {
    const src = readFileSync(
      join(repoRoot, "apps", "web", "lib/env.ts"),
      "utf8"
    );
    expect(src).toContain("getValidatedGatewayEnv");
    expect(src).toMatch(/export const getValidatedWebEnv/);
  });
});
