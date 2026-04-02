import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTrustedClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
  getSafeRedirectUri: vi.fn(),
  isValidRelativePath: vi.fn(),
  getSafeRelativePath: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  generateCSRFToken: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("./auth-redirect", () => ({
  getLoginUrl: (redirectUri?: string) =>
    `https://helvety.com/login?redirect_uri=${encodeURIComponent(
      redirectUri ?? "https://helvety.com"
    )}`,
}));

vi.mock("./client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("./rate-limit", () => ({
  RATE_LIMITS: {
    AUTH_CALLBACK: { maxRequests: 20, windowMs: 60_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("./redirect-validation", () => ({
  getSafeRedirectUri: mocks.getSafeRedirectUri,
  isValidRelativePath: mocks.isValidRelativePath,
  getSafeRelativePath: mocks.getSafeRelativePath,
}));

vi.mock("./supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mocks.exchangeCodeForSession,
        verifyOtp: mocks.verifyOtp,
      },
    }),
}));

vi.mock("./csrf", () => ({
  generateCSRFToken: mocks.generateCSRFToken,
}));

vi.mock("./logger", () => ({
  logger: {
    error: mocks.loggerError,
    logUnexpectedError: mocks.loggerError,
  },
}));

import { createAuthCallbackHandler } from "./auth-callback";

describe("createAuthCallbackHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("203.0.113.10");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    mocks.getSafeRedirectUri.mockReturnValue(null);
    mocks.isValidRelativePath.mockReturnValue(true);
    mocks.getSafeRelativePath.mockReturnValue("/");
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.verifyOtp.mockResolvedValue({ error: null });
    mocks.generateCSRFToken.mockResolvedValue(undefined);
  });

  it("uses strict policy for callback rate limiting", async () => {
    const handler = createAuthCallbackHandler();

    await handler(
      new Request("https://helvety.com/auth/callback?code=abc123") as never
    );

    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      "auth_callback:ip:203.0.113.10",
      20,
      60_000,
      "auth",
      "strict"
    );
  });

  it("rejects invalid next path before auth exchange", async () => {
    mocks.isValidRelativePath.mockReturnValue(false);
    const handler = createAuthCallbackHandler();

    const response = await handler(
      new Request(
        "https://helvety.com/auth/callback?code=abc123&next=https://evil.com"
      ) as never
    );

    expect(response.headers.get("location")).toContain("error=invalid_next");
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("returns missing_client_ip when trusted client IP is unavailable", async () => {
    mocks.getTrustedClientIp.mockReturnValue(null);
    const handler = createAuthCallbackHandler();

    const response = await handler(
      new Request("https://helvety.com/auth/callback?code=abc123") as never
    );

    expect(response.headers.get("location")).toContain(
      "error=missing_client_ip"
    );
  });

  it("returns rate_limited when callback rate limit denies request", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfter: 60,
    });
    const handler = createAuthCallbackHandler();

    const response = await handler(
      new Request("https://helvety.com/auth/callback?code=abc123") as never
    );

    expect(response.headers.get("location")).toContain("error=rate_limited");
  });

  it("rejects unsupported otp type", async () => {
    const handler = createAuthCallbackHandler();

    const response = await handler(
      new Request(
        "https://helvety.com/auth/callback?token_hash=abc123&type=phone_change"
      ) as never
    );

    expect(response.headers.get("location")).toContain("invalid_otp_type");
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("redirects to validated redirect_uri after successful exchange", async () => {
    mocks.getSafeRedirectUri.mockReturnValue("http://localhost:3007/notes");
    const handler = createAuthCallbackHandler();

    const response = await handler(
      new Request(
        "https://helvety.com/auth/callback?code=abc123&redirect_uri=http://localhost:3007/notes"
      ) as never
    );

    expect(response.headers.get("location")).toBe(
      "https://helvety.com/login?redirect_uri=http%3A%2F%2Flocalhost%3A3007%2Fnotes"
    );
  });

  it("redirects token-hash callbacks through login with redirect_uri", async () => {
    mocks.getSafeRedirectUri.mockReturnValue("https://helvety.com/tasks");
    const handler = createAuthCallbackHandler();

    const response = await handler(
      new Request(
        "https://helvety.com/auth/callback?token_hash=abc123&type=signup&redirect_uri=https://helvety.com/tasks"
      ) as never
    );

    expect(mocks.verifyOtp).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(
      "https://helvety.com/login?redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks"
    );
  });
});
