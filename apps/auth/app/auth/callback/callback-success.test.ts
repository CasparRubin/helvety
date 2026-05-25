import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTrustedClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
  getSafeRedirectUri: vi.fn(),
  isValidRelativePath: vi.fn(),
  getSafeRelativePath: vi.fn(),
  verifyOtp: vi.fn(),
  generateCSRFToken: vi.fn(),
  getAuthUser: vi.fn(),
  checkUserPasskeyStatus: vi.fn(),
  hasEncryptionSetup: vi.fn(),
  setDeviceTrustCookie: vi.fn(),
}));

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("@helvety/shared/rate-limit", () => ({
  RATE_LIMITS: {
    AUTH_CALLBACK: { maxRequests: 20, windowMs: 60_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@helvety/shared/redirect-validation", () => ({
  getSafeRedirectUri: mocks.getSafeRedirectUri,
  isValidRelativePath: mocks.isValidRelativePath,
  getSafeRelativePath: mocks.getSafeRelativePath,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: {
        verifyOtp: mocks.verifyOtp,
      },
    }),
}));

vi.mock("@helvety/shared/csrf", () => ({
  generateCSRFToken: mocks.generateCSRFToken,
}));

vi.mock("@helvety/shared/auth-retry", () => ({
  getAuthUser: mocks.getAuthUser,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    logUnexpectedError: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/app/actions/device-trust-cookie", () => ({
  setDeviceTrustCookie: mocks.setDeviceTrustCookie,
}));

vi.mock("@/app/actions/auth-action-helpers", () => ({
  checkUserPasskeyStatus: mocks.checkUserPasskeyStatus,
}));

vi.mock("@/app/actions/encryption-actions", () => ({
  hasEncryptionSetup: mocks.hasEncryptionSetup,
}));

import { GET } from "./route";

describe("auth callback success handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("127.0.0.1");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.getSafeRedirectUri.mockImplementation(
      (uri: string | null | undefined) => uri ?? null
    );
    mocks.isValidRelativePath.mockReturnValue(true);
    mocks.getSafeRelativePath.mockReturnValue("/");
    mocks.verifyOtp.mockResolvedValue({ error: null });
    mocks.generateCSRFToken.mockResolvedValue(undefined);
    mocks.getAuthUser.mockResolvedValue({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "u@example.com",
      },
    });
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true },
    });
    mocks.hasEncryptionSetup.mockResolvedValue({
      success: true,
      data: true,
    });
    mocks.setDeviceTrustCookie.mockResolvedValue(undefined);
  });

  it("mints device trust and redirects to passkey sign-in after OTP callback", async () => {
    const response = await GET(
      new Request(
        "https://helvety.com/auth/callback?token_hash=abc&type=signup&redirect_uri=https://helvety.com/tasks"
      )
    );

    expect(mocks.verifyOtp).toHaveBeenCalledOnce();
    expect(mocks.setDeviceTrustCookie).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000"
    );

    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("step=passkey-signin");
    expect(location).toContain(
      "redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks"
    );
  });
});
