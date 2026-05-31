import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AUTH_MAX_LIFETIME_MS,
  AUTH_MAX_LIFETIME_SECONDS,
  AUTH_SLIDING_IDLE_MS,
} from "./auth-session-policy";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a repo file relative to the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("auth session policy wiring", () => {
  it("exports unified 24h sliding / 7d cap constants", () => {
    expect(AUTH_SLIDING_IDLE_MS).toBe(24 * 60 * 60 * 1000);
    expect(AUTH_MAX_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(AUTH_MAX_LIFETIME_SECONDS).toBe(7 * 24 * 60 * 60);
  });

  it("vault-session aliases policy constants", () => {
    const src = readRepoFile("packages/shared/src/crypto/vault-session.ts");
    expect(src).toContain("AUTH_SLIDING_IDLE_MS");
    expect(src).toContain("AUTH_MAX_LIFETIME_MS");
    expect(src).not.toMatch(/12 \* 60 \* 60 \* 1000/);
    expect(src).not.toMatch(/30 \* 24 \* 60 \* 60 \* 1000/);
  });

  it("prf-salt-cache uses policy max lifetime", () => {
    const src = readRepoFile("packages/shared/src/crypto/prf-salt-cache.ts");
    expect(src).toContain("AUTH_MAX_LIFETIME_MS");
  });

  it("device-trust-cookie uses policy max lifetime seconds", () => {
    const src = readRepoFile("packages/shared/src/device-trust-cookie.ts");
    expect(src).toContain("AUTH_MAX_LIFETIME_SECONDS");
    expect(src).not.toMatch(/30 \* 24 \* 60 \* 60/);
  });

  it("auth device-trust wrapper delegates to shared module", () => {
    const src = readRepoFile("apps/auth/app/actions/device-trust-cookie.ts");
    expect(src).toContain("@helvety/shared/device-trust-cookie");
    expect(src).not.toContain("DEVICE_TRUST_TTL_SECONDS");
  });

  it("E2EE page auth and action helpers enforce device trust", () => {
    const pageAuth = readRepoFile("packages/shared/src/e2ee-page-auth.ts");
    expect(pageAuth).toContain("requireDeviceTrust: true");
    expect(pageAuth).toContain("E2EE_DEVICE_TRUST_RATE_LIMIT_PREFIXES");

    const actionHelpers = readRepoFile("packages/shared/src/action-helpers.ts");
    expect(actionHelpers).toContain("requiresE2eeDeviceTrust");
    expect(actionHelpers).toContain("requireDeviceTrust");
  });

  it("encryption context uses shared vault idle lock hook", () => {
    const encryptionContext = readRepoFile(
      "packages/shared/src/crypto/encryption-context.tsx"
    );
    expect(encryptionContext).toContain("useVaultIdleLock");
  });
});
