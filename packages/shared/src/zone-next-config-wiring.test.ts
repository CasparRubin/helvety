import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("zone next.config presets", () => {
  it.each(["contacts", "tasks", "notes", "links"] as const)(
    "apps/%s uses createE2eeZoneNextConfig",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "next.config.ts"),
        "utf8"
      );
      expect(src).toContain("createE2eeZoneNextConfig");
      expect(src).toContain(`appName: "${app}"`);
    }
  );

  it("auth uses createAuthGatewayNextConfig", () => {
    const src = readFileSync(
      join(repoRoot, "apps/auth/next.config.ts"),
      "utf8"
    );
    expect(src).toContain("createAuthGatewayNextConfig");
  });

  it.each(["pdf", "docs", "image-upscaler"] as const)(
    "apps/%s uses createPublicToolNextConfig",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "next.config.ts"),
        "utf8"
      );
      expect(src).toContain("createPublicToolNextConfig");
      expect(src).toContain(`appName: "${app}"`);
    }
  );

  it.each(["web", "store"] as const)(
    "apps/%s keeps bespoke createHelvetyNextConfig",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "next.config.ts"),
        "utf8"
      );
      expect(src).toContain("createHelvetyNextConfig");
      expect(src).not.toContain("createE2eeZoneNextConfig");
      expect(src).not.toContain("createPublicToolNextConfig");
    }
  );
});
