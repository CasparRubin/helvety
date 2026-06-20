import { describe, expect, it } from "vitest";

import { AUTH_MAX_LIFETIME_MS } from "./auth-session-policy";
import {
  getJwtIssuedAtMs,
  isJwtWithinMaxLifetime,
} from "./jwt-session-lifetime";

/** Builds an unsigned JWT for unit tests (payload only; no signature verify). */
function testJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}

describe("jwt-session-lifetime", () => {
  it("reads iat from access token payload", () => {
    const iat = 1_700_000_000;
    const token = testJwt({ iat, sub: "user-1" });
    expect(getJwtIssuedAtMs(token)).toBe(iat * 1000);
  });

  it("accepts tokens issued within the max lifetime window", () => {
    const now = 1_700_000_000_000;
    const iatSeconds = Math.floor((now - AUTH_MAX_LIFETIME_MS + 60_000) / 1000);
    const token = testJwt({ iat: iatSeconds });
    expect(isJwtWithinMaxLifetime(token, AUTH_MAX_LIFETIME_MS, now)).toBe(true);
  });

  it("rejects tokens older than the max lifetime window", () => {
    const now = 1_700_000_000_000;
    const iatSeconds = Math.floor((now - AUTH_MAX_LIFETIME_MS - 1) / 1000);
    const token = testJwt({ iat: iatSeconds });
    expect(isJwtWithinMaxLifetime(token, AUTH_MAX_LIFETIME_MS, now)).toBe(
      false
    );
  });

  it("rejects malformed tokens", () => {
    expect(isJwtWithinMaxLifetime("not-a-jwt")).toBe(false);
    expect(getJwtIssuedAtMs("a.b")).toBe(null);
  });
});
