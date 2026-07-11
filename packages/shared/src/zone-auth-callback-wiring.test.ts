import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const ZONE_APPS_WITH_AUTH_CALLBACK = [
  "auth",
  "contacts",
  "image-upscaler",
  "image-editor",
  "links",
  "notes",
  "ocr",
  "pdf",
  "store",
  "tasks",
] as const;

describe("zone auth callback wiring", () => {
  it.each(ZONE_APPS_WITH_AUTH_CALLBACK)(
    "apps/%s uses shared createAuthCallbackHandler",
    (app) => {
      const routePath = join(
        repoRoot,
        "apps",
        app,
        "app",
        "auth",
        "callback",
        "route.ts"
      );
      const src = readFileSync(routePath, "utf8");
      expect(src).toContain("createAuthCallbackHandler");
      expect(src).toContain("@helvety/shared/auth-callback");
      expect(src).toMatch(/export const GET = createAuthCallbackHandler/);
    }
  );
});
