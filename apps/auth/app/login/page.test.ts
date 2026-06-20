import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");

describe("login page server gate", () => {
  it("resolves entry with device trust and uses trusted-only passkey canonical redirect helper", () => {
    const src = readFileSync(pagePath, "utf8");

    expect(src).toContain("resolveLoginEntryStep");
    expect(src).toContain("getDeviceTrustStatus");
    expect(src).toContain("buildAuthLoginPath");
    expect(src).toContain("shouldCanonicalizeTrustedPasskeyLoginUrl");
    expect(src).toContain("hasSession: Boolean(user)");
    expect(src).toContain("initialStep={entry.step}");
    expect(src).toContain("initialTrustedUserId={entry.trustedUserId}");
  });
});
