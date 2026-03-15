import { describe, expect, it } from "vitest";

import { resolveRequestOrigin } from "./request-origin";

/** Build request headers for origin-resolution tests. */
function toHeaders(values: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(values)) {
    headers.set(key, value);
  }
  return headers;
}

describe("resolveRequestOrigin", () => {
  it("uses x-forwarded host and proto when available", () => {
    const origin = resolveRequestOrigin(
      toHeaders({
        "x-forwarded-proto": "https",
        "x-forwarded-host": "helvety.com",
        host: "internal.vercel.app",
      })
    );

    expect(origin).toBe("https://helvety.com");
  });

  it("falls back to host header", () => {
    const origin = resolveRequestOrigin(
      toHeaders({
        host: "localhost:3007",
      })
    );

    expect(origin).toBe("http://localhost:3007");
  });

  it("returns null when no host information exists", () => {
    const origin = resolveRequestOrigin(new Headers());
    expect(origin).toBeNull();
  });
});
