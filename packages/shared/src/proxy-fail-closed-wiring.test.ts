import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const FAIL_CLOSED_PROXY_APPS = [
  "auth",
  "tasks",
  "contacts",
  "notes",
  "links",
] as const;

const OPEN_REFRESH_PROXY_APPS = [
  "web",
  "store",
  "docs",
  "pdf",
  "image-upscaler",
] as const;

/** Reads `apps/<app>/proxy.ts` for static wiring assertions. */
function readProxySource(app: string): string {
  return readFileSync(join(repoRoot, "apps", app, "proxy.ts"), "utf8");
}

describe("zone proxy fail-closed auth refresh wiring", () => {
  it.each(FAIL_CLOSED_PROXY_APPS)(
    "apps/%s enables failClosedOnAuthRefresh on createAppProxy",
    (app) => {
      expect(readProxySource(app)).toContain("failClosedOnAuthRefresh: true");
    }
  );

  it.each(OPEN_REFRESH_PROXY_APPS)(
    "apps/%s does not set failClosedOnAuthRefresh on createAppProxy",
    (app) => {
      const src = readProxySource(app);
      expect(src).not.toContain("failClosedOnAuthRefresh: true");
    }
  );
});
