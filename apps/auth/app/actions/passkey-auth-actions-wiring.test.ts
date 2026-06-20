import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const passkeyActionsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "passkey-auth-actions.ts"
);

describe("passkey-auth-actions generatePasskeyAuthOptions wiring", () => {
  const src = readFileSync(passkeyActionsPath, "utf8");

  it("normalizes options latency via ensurePasskeyOptionsMinDuration in finally", () => {
    const fnStart = src.indexOf(
      "export async function generatePasskeyAuthOptions"
    );
    const fnEnd = src.indexOf(
      "export async function verifyPasskeyAuthentication"
    );
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const body = src.slice(fnStart, fnEnd);
    expect(body).toContain("optionsStartedAt = Date.now()");
    expect(body).toContain("ensurePasskeyOptionsMinDuration");
    expect(body).toMatch(/finally\s*\{[\s\S]*ensurePasskeyOptionsMinDuration/);
  });

  it("records optionsStartedAt after rate-limit guard passes", () => {
    const fnStart = src.indexOf(
      "export async function generatePasskeyAuthOptions"
    );
    const fnEnd = src.indexOf(
      "export async function verifyPasskeyAuthentication"
    );
    const body = src.slice(fnStart, fnEnd);
    const rateLimitIdx = body.indexOf("runRateLimitGuard");
    const startedAtIdx = body.indexOf("optionsStartedAt = Date.now()");
    expect(rateLimitIdx).toBeGreaterThan(-1);
    expect(startedAtIdx).toBeGreaterThan(rateLimitIdx);
  });
});
