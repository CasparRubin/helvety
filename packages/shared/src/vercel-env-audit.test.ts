import { describe, expect, it } from "vitest";

import { auditProjectEnv } from "../../../scripts/audit-vercel-production-env.mjs";
import {
  EXPECTED_KEYS_BY_APP,
  WEB_GATEWAY_KEYS,
} from "../../../scripts/env-template-expectations.mjs";

/** Asserts env-template expectations exist for an app tier. */
function requireAppKeys(keys: string[] | undefined, app: string): string[] {
  expect(keys, `missing expectations for ${app}`).toBeDefined();
  if (!keys) {
    throw new Error(`missing expectations for ${app}`);
  }
  return keys;
}

describe("auditProjectEnv", () => {
  it("passes when all expected keys are present for an E2EE zone", () => {
    const keys = requireAppKeys(EXPECTED_KEYS_BY_APP.tasks, "tasks");
    const { errors, warnings, toRemove } = auditProjectEnv({
      project: "helvety-tasks",
      app: "tasks",
      keys,
      target: "production",
    });

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(toRemove).toEqual([]);
  });

  it("flags missing required keys with the active target label", () => {
    const { errors } = auditProjectEnv({
      project: "helvety-pdf",
      app: "pdf",
      keys: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "HELVETY_COOKIE_SIGNING_SECRET",
      ],
      target: "preview",
    });

    expect(errors).toEqual([
      "helvety-pdf: missing required preview keys: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    ]);
  });

  it("flags forbidden keys and records them for removal", () => {
    const keys = [
      ...requireAppKeys(EXPECTED_KEYS_BY_APP.tasks, "tasks"),
      "SUPABASE_SECRET_KEY",
    ];
    const { errors, toRemove } = auditProjectEnv({
      project: "helvety-tasks",
      app: "tasks",
      keys,
    });

    expect(errors).toContain(
      "helvety-tasks: remove forbidden key for tasks tier: SUPABASE_SECRET_KEY"
    );
    expect(toRemove).toEqual([
      {
        project: "helvety-tasks",
        app: "tasks",
        key: "SUPABASE_SECRET_KEY",
      },
    ]);
  });

  it("warns on legacy Supabase key names", () => {
    const { warnings } = auditProjectEnv({
      project: "helvety-auth",
      app: "auth",
      keys: [
        ...requireAppKeys(EXPECTED_KEYS_BY_APP.auth, "auth"),
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
    });

    expect(
      warnings.some((warning) => warning.includes("legacy Supabase key name"))
    ).toBe(true);
  });

  it("requires all gateway rewrite URLs on helvety-com", () => {
    const webKeys = requireAppKeys(EXPECTED_KEYS_BY_APP.web, "web");
    const { errors } = auditProjectEnv({
      project: "helvety-com",
      app: "web",
      keys: webKeys.filter((key) => key !== "DOCS_URL"),
    });

    expect(errors).toContain(
      "helvety-com: missing gateway rewrite URLs: DOCS_URL"
    );
    expect(WEB_GATEWAY_KEYS).toContain("DOCS_URL");
  });
});
