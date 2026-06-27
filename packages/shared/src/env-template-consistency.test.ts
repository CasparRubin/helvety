import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  EXPECTED_KEYS_BY_APP,
  FORBIDDEN_KEYS_BY_APP,
  parseTemplateKeys,
  productionEnvKeyIsPresent,
  productionEnvKeyIsExpectedOrAlias,
  validateEnvTemplates,
  validateTurboGatewayBuildEnv,
  WEB_GATEWAY_KEYS,
} from "../../../scripts/env-template-expectations.mjs";

import { HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS } from "./analytics-guardrails";

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

  it("documents DEVICE_TRUST_COOKIE_SECRET on auth and user-scoped E2EE zones", () => {
    const e2eeApps = new Set(["auth", "tasks", "contacts", "notes", "links"]);
    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const hasDeviceTrust = keys.includes("DEVICE_TRUST_COOKIE_SECRET");
      expect(hasDeviceTrust).toBe(e2eeApps.has(app));
    }
  });

  it("zone READMEs document DEVICE_TRUST_COOKIE_SECRET when env.template requires it", async () => {
    const e2eeApps = ["auth", "tasks", "contacts", "notes", "links"] as const;
    for (const app of e2eeApps) {
      const readme = await readFile(
        resolve(repoRoot, `apps/${app}/README.md`),
        "utf8"
      );
      expect(readme, `apps/${app}/README.md`).toContain(
        "DEVICE_TRUST_COOKIE_SECRET"
      );
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

  it("defines forbidden keys for every app in EXPECTED_KEYS_BY_APP", () => {
    expect(Object.keys(FORBIDDEN_KEYS_BY_APP).sort()).toEqual(
      Object.keys(EXPECTED_KEYS_BY_APP).sort()
    );
  });

  it("forbids removed Vercel analytics env keys on every zone", () => {
    for (const [app, keys] of Object.entries(FORBIDDEN_KEYS_BY_APP)) {
      for (const analyticsKey of HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS) {
        expect(keys, `apps/${app}`).toContain(analyticsKey);
      }
    }
  });

  it("env.template files do not document forbidden analytics env keys", async () => {
    const keyLine = (key: string) => new RegExp(`^${key}=`, "m");
    for (const app of Object.keys(EXPECTED_KEYS_BY_APP)) {
      const content = await readFile(
        resolve(repoRoot, `apps/${app}/env.template`),
        "utf8"
      );
      for (const key of HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS) {
        expect(content, `apps/${app}/env.template`).not.toMatch(keyLine(key));
      }
    }
  });

  it("web env.template documents gateway tier (no cookie signing / Upstash)", async () => {
    const content = await readFile(
      resolve(repoRoot, "apps/web/env.template"),
      "utf8"
    );
    expect(content).toContain("intentionally omits");
    expect(content).toContain("HELVETY_COOKIE_SIGNING_SECRET");
    expect(parseTemplateKeys(content)).not.toContain("UPSTASH_REDIS_REST_URL");
  });

  it("env.template files include expected keys per app", async () => {
    for (const app of Object.keys(EXPECTED_KEYS_BY_APP)) {
      const templatePath = `apps/${app}/env.template`;
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

  it("env documentation references tiers, gateway URLs, and local/Vercel audit commands", async () => {
    const docsWithAuditCommands = [
      "README.md",
      "docs/env-vercel-audit-checklist.md",
      "docs/naming-conventions.md",
    ] as const;

    for (const relativePath of docsWithAuditCommands) {
      const content = await readFile(resolve(repoRoot, relativePath), "utf8");
      expect(content, relativePath).toContain("consistency:env-templates");
      expect(content, relativePath).toContain("consistency:local-env");
      if (relativePath !== "docs/env-vercel-audit-checklist.md") {
        expect(content, relativePath).toContain(
          "env-vercel-audit-checklist.md"
        );
      }
    }

    const turboTiers = await readFile(
      resolve(repoRoot, "docs/turbo-env-tiers.md"),
      "utf8"
    );
    expect(turboTiers).toContain("consistency:local-env");
    expect(turboTiers).toContain("tasks`, `contacts`, `notes`, `links`");
    expect(turboTiers).toContain("env-vercel-audit-checklist.md");

    const vercelApps = await readFile(
      resolve(repoRoot, "docs/vercel-monorepo-apps.md"),
      "utf8"
    );
    expect(vercelApps).toContain("env-vercel-audit-checklist.md");

    const auditChecklist = await readFile(
      resolve(repoRoot, "docs/env-vercel-audit-checklist.md"),
      "utf8"
    );
    expect(auditChecklist).toContain("helvety-com");
    expect(auditChecklist).toContain("consistency:vercel-preview-env");
    expect(auditChecklist).not.toContain("helvety-web");

    const securityRunbook = await readFile(
      resolve(repoRoot, "docs/security-review-runbook.md"),
      "utf8"
    );
    expect(securityRunbook).toContain("consistency:vercel-preview-env");
    expect(securityRunbook).not.toMatch(
      /node scripts\/audit-vercel-production-env\.mjs --preview/
    );
  });

  it("env.template files do not document legacy Supabase key names", async () => {
    const legacyKeyPattern =
      /^(NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)=/m;
    for (const app of Object.keys(EXPECTED_KEYS_BY_APP)) {
      const content = await readFile(
        resolve(repoRoot, `apps/${app}/env.template`),
        "utf8"
      );
      expect(content, `apps/${app}/env.template`).not.toMatch(legacyKeyPattern);
    }
  });

  it("productionEnvKeyIsPresent requires the expected key", () => {
    expect(
      productionEnvKeyIsPresent(
        "HELVETY_CHROME_EXTENSION_ORIGINS",
        new Set(["HELVETY_CHROME_EXTENSION_ORIGINS"])
      )
    ).toBe(true);
    expect(
      productionEnvKeyIsPresent(
        "HELVETY_CHROME_EXTENSION_ORIGINS",
        new Set<string>()
      )
    ).toBe(false);
  });

  it("productionEnvKeyIsPresent does not accept HELVEETY_CHROME_EXTENSION_ORIGINS alias", () => {
    expect(
      productionEnvKeyIsPresent(
        "HELVETY_CHROME_EXTENSION_ORIGINS",
        new Set(["HELVEETY_CHROME_EXTENSION_ORIGINS"])
      )
    ).toBe(false);
  });

  it("productionEnvKeyIsExpectedOrAlias does not treat HELVEETY as an alias", () => {
    expect(
      productionEnvKeyIsExpectedOrAlias(
        "HELVEETY_CHROME_EXTENSION_ORIGINS",
        new Set(["HELVETY_CHROME_EXTENSION_ORIGINS"])
      )
    ).toBe(false);
  });

  it("auth env.template documents HELVETY_CHROME_EXTENSION_ORIGINS only", async () => {
    const content = await readFile(
      resolve(repoRoot, "apps/auth/env.template"),
      "utf8"
    );
    expect(content).toContain("HELVETY_CHROME_EXTENSION_ORIGINS");
    expect(content).not.toContain("HELVEETY_CHROME_EXTENSION_ORIGINS");
    expect(content).toMatch(/extension ids|32-char/i);
    expect(content).toContain(
      "HELVETY_CHROME_EXTENSION_ORIGINS=your-32-char-extension-id-here"
    );
  });

  it("env-vercel-audit-checklist documents bare extension ids and passkey curl verify", async () => {
    const content = await readFile(
      resolve(repoRoot, "docs/env-vercel-audit-checklist.md"),
      "utf8"
    );
    expect(content).toContain("HELVETY_CHROME_EXTENSION_ORIGINS");
    expect(content).toContain("kjdldfioiofpblkchjodefakpopmkjjf");
    expect(content).toContain("/api/extension/passkey/options");
    expect(content).toMatch(/Expect \*\*`401`\*\*/);
  });

  it("EXPECTED_KEYS_BY_APP covers every zone app directory", () => {
    expect(Object.keys(EXPECTED_KEYS_BY_APP).sort()).toEqual(
      [
        "auth",
        "contacts",
        "image-upscaler",
        "links",
        "notes",
        "pdf",
        "store",
        "tasks",
        "web",
      ].sort()
    );
  });
});
