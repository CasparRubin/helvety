import { afterEach, describe, expect, it, vi } from "vitest";

import { getTrustedClientIp } from "./client-ip";

const ORIGINAL_ENV = { ...process.env };

/** Build a Headers object from a simple key/value map. */
function toHeaders(values: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(values)) {
    headers.set(key, value);
  }
  return headers;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getTrustedClientIp", () => {
  it("prefers x-real-ip in production when trusted proxy is required", () => {
    vi.stubEnv("NODE_ENV", "production");

    const ip = getTrustedClientIp(
      toHeaders({
        "x-real-ip": "198.51.100.2",
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      }),
      { requireTrustedProxyInProduction: true }
    );

    expect(ip).toBe("198.51.100.2");
  });

  it("returns null in production with required trusted proxy and no proxy headers", () => {
    vi.stubEnv("NODE_ENV", "production");

    const ip = getTrustedClientIp(toHeaders({}), {
      requireTrustedProxyInProduction: true,
    });

    expect(ip).toBeNull();
  });

  it("falls back to x-real-ip when trusted mode is not required", () => {
    vi.stubEnv("NODE_ENV", "production");

    const ip = getTrustedClientIp(
      toHeaders({
        "x-real-ip": "198.51.100.2",
      })
    );

    expect(ip).toBe("198.51.100.2");
  });

  it("uses configured fallback when no header is present", () => {
    vi.stubEnv("NODE_ENV", "development");

    const ip = getTrustedClientIp(toHeaders({}), { fallback: "unknown" });

    expect(ip).toBe("unknown");
  });

  it("rejects malformed proxy header values", () => {
    vi.stubEnv("NODE_ENV", "production");

    const ip = getTrustedClientIp(
      toHeaders({
        "x-real-ip": "not-an-ip",
        "x-forwarded-for": "unknown",
      }),
      { requireTrustedProxyInProduction: true }
    );

    expect(ip).toBeNull();
  });

  it("normalizes ip:port values from forwarded headers", () => {
    vi.stubEnv("NODE_ENV", "production");

    const ip = getTrustedClientIp(
      toHeaders({
        "x-forwarded-for": "203.0.113.7:443, 10.0.0.1",
      }),
      { requireTrustedProxyInProduction: true }
    );

    expect(ip).toBeNull();
  });
});
