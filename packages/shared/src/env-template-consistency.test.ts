import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  EXPECTED_KEYS_BY_APP,
  parseTemplateKeys,
  validateEnvTemplates,
  validateTurboGatewayBuildEnv,
  WEB_GATEWAY_KEYS,
} from "../../../scripts/env-template-expectations.mjs";

const testDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");

describe("env.template consistency", () => {
  it("matches validateEnvTemplates guardrail (all apps)", async () => {
    const errors = await validateEnvTemplates(repoRoot);
    expect(errors).toEqual([]);
  });

  it("matches validateTurboGatewayBuildEnv guardrail", async () => {
    const errors = await validateTurboGatewayBuildEnv(repoRoot);
    expect(errors).toEqual([]);
  });

  it("WEB_GATEWAY_KEYS matches turbo.json build env gateway URLs", async () => {
    const turbo = JSON.parse(
      await readFile(resolve(repoRoot, "turbo.json"), "utf8")
    ) as { tasks?: { build?: { env?: string[] } } };
    const buildEnv = turbo.tasks?.build?.env ?? [];
    expect([...WEB_GATEWAY_KEYS].sort()).toEqual(
      WEB_GATEWAY_KEYS.filter((key) => buildEnv.includes(key)).sort()
    );
  });

  it("documents DEVICE_TRUST_COOKIE_SECRET only on auth", () => {
    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const hasDeviceTrust = keys.includes("DEVICE_TRUST_COOKIE_SECRET");
      expect(hasDeviceTrust).toBe(app === "auth");
    }
  });

  it("documents gateway rewrite URLs only on web", () => {
    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const gatewayCount = WEB_GATEWAY_KEYS.filter((key) =>
        keys.includes(key)
      ).length;
      expect(gatewayCount).toBe(app === "web" ? WEB_GATEWAY_KEYS.length : 0);
    }
  });

  it("documents SUPABASE_SECRET_KEY only on auth and store", () => {
    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const hasSecret = keys.includes("SUPABASE_SECRET_KEY");
      expect(hasSecret).toBe(app === "auth" || app === "store");
    }
  });

  it("documents Upstash Redis keys on all server-validated zones except web", () => {
    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const hasUpstash =
        keys.includes("UPSTASH_REDIS_REST_URL") &&
        keys.includes("UPSTASH_REDIS_REST_TOKEN");
      expect(hasUpstash).toBe(app !== "web");
    }
  });

  it("env.template files include expected keys per app", async () => {
    const envModules: Array<{ app: string; templatePath: string }> = [
      { app: "auth", templatePath: "apps/auth/env.template" },
      { app: "notes", templatePath: "apps/notes/env.template" },
      { app: "tasks", templatePath: "apps/tasks/env.template" },
      { app: "contacts", templatePath: "apps/contacts/env.template" },
      { app: "links", templatePath: "apps/links/env.template" },
      { app: "store", templatePath: "apps/store/env.template" },
      { app: "pdf", templatePath: "apps/pdf/env.template" },
      { app: "docs", templatePath: "apps/docs/env.template" },
      {
        app: "image-upscaler",
        templatePath: "apps/image-upscaler/env.template",
      },
      { app: "web", templatePath: "apps/web/env.template" },
    ];

    for (const { app, templatePath } of envModules) {
      const absolutePath = resolve(repoRoot, templatePath);
      const content = await readFile(absolutePath, "utf8");
      const templateKeys = parseTemplateKeys(content);
      const expectedKeys = EXPECTED_KEYS_BY_APP[app];

      expect(expectedKeys, `missing expectations for ${app}`).toBeDefined();
      if (expectedKeys === undefined) {
        throw new Error(`missing expectations for ${app}`);
      }
      expect(templateKeys.sort()).toEqual([...expectedKeys].sort());
    }
  });
});
