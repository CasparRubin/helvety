import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const gatewaySmokePath = join(repoRoot, "e2e/gateway-smoke.spec.ts");
const gatewaySmokeSource = readFileSync(gatewaySmokePath, "utf8");

const PUBLIC_TOOL_ROUTES = [
  "/pdf",
  "/image-upscaler",
  "/image-editor",
  "/ocr",
] as const;

describe("gateway smoke e2e wiring", () => {
  it.each(PUBLIC_TOOL_ROUTES)("covers public tool rewrite for %s", (route) => {
    expect(gatewaySmokeSource).toContain(`page.goto("${route}")`);
  });

  it("covers credential-free core gateway and E2EE rewrite routes", () => {
    for (const route of ["/", "/store", "/auth/robots.txt", "/tasks"]) {
      expect(gatewaySmokeSource).toContain(`page.goto("${route}")`);
    }
    expect(gatewaySmokeSource).not.toContain('page.goto("/auth/login")');
    expect(gatewaySmokeSource).not.toContain("INVALID_ID/download");
  });
});
