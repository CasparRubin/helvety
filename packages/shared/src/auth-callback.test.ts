import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTrustedClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  generateCSRFToken: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("./auth-redirect", () => ({
  getLoginUrl: () => "https://helvety.com/login",
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
  getSafeRelativePath: () => "/",
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
  },
}));

import { createAuthCallbackHandler } from "./auth-callback";

describe("createAuthCallbackHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("203.0.113.10");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
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
});
