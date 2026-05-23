import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  EXPECTED_KEYS_BY_APP,
  parseTemplateKeys,
  validateEnvTemplates,
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

  it("documents DEVICE_TRUST_COOKIE_SECRET only on auth", () => {
    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const hasDeviceTrust = keys.includes("DEVICE_TRUST_COOKIE_SECRET");
      expect(hasDeviceTrust).toBe(app === "auth");
    }
  });

  it("documents gateway rewrite URLs only on web", () => {
    const gatewayKeys = [
      "AUTH_URL",
      "STORE_URL",
      "PDF_URL",
      "DOCS_URL",
      "IMAGE_UPSCALER_URL",
      "TASKS_URL",
      "CONTACTS_URL",
      "NOTES_URL",
      "LINKS_URL",
    ] as const;

    for (const [app, keys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
      const gatewayCount = gatewayKeys.filter((key) =>
        keys.includes(key)
      ).length;
      expect(gatewayCount).toBe(app === "web" ? gatewayKeys.length : 0);
    }
  });

  it("lib/env.ts envTemplatePath values point at existing templates with expected keys", async () => {
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
