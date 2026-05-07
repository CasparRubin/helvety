import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieValue: undefined as string | undefined,
  headerValue: null as string | null,
  parsedCookieToken: null as string | null,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) =>
      name === "csrf_token" && mocks.cookieValue
        ? { name, value: mocks.cookieValue }
        : undefined
    ),
  })),
  headers: vi.fn(async () => ({
    get: vi.fn((name: string) =>
      name === "x-csrf-bootstrap-token" ? mocks.headerValue : null
    ),
  })),
}));

vi.mock("./csrf", () => ({
  getCSRFTokenFromCookieValue: vi.fn(async () => mocks.parsedCookieToken),
}));

vi.mock("./supabase/server", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("./auth-retry", () => ({
  getAuthUser: vi.fn(),
}));

describe("getCachedCSRFToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mocks.cookieValue = undefined;
    mocks.headerValue = null;
    mocks.parsedCookieToken = null;
  });

  it("returns the validated cookie token when available", async () => {
    mocks.cookieValue = "signed-cookie";
    mocks.parsedCookieToken = "cookie-token";
    mocks.headerValue = "header-token";

    const { getCachedCSRFToken } = await import("./cached-server");
    await expect(getCachedCSRFToken()).resolves.toBe("cookie-token");
  });

  it("falls back to bootstrap header when cookie token is missing", async () => {
    mocks.cookieValue = undefined;
    mocks.parsedCookieToken = null;
    mocks.headerValue = "bootstrap-token";

    const { getCachedCSRFToken } = await import("./cached-server");
    await expect(getCachedCSRFToken()).resolves.toBe("bootstrap-token");
  });

  it("returns null when neither cookie nor bootstrap header is present", async () => {
    const { getCachedCSRFToken } = await import("./cached-server");
    await expect(getCachedCSRFToken()).resolves.toBeNull();
  });
});
