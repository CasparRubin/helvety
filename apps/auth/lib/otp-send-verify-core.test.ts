import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  checkEscalatingLockout: vi.fn(),
  checkRateLimit: vi.fn(),
  createClient: vi.fn(),
  getSupabaseKey: vi.fn(),
  getSupabaseUrl: vi.fn(),
  logAuthEvent: vi.fn(),
  recordOtpFailureAndCheckLockout: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@helvety/shared/auth-logger", () => ({
  AUTH_ACTIONS: {
    verifyEmailCode: "verifyEmailCode",
  },
  AUTH_REASONS: {
    escalatingLockout: "escalating_lockout",
    noUser: "no_user",
  },
  logAuthEvent: mocks.logAuthEvent,
}));

vi.mock("@helvety/shared/env-validation", () => ({
  getSupabaseKey: mocks.getSupabaseKey,
  getSupabaseUrl: mocks.getSupabaseUrl,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    OTP_VERIFY: { maxRequests: 5, windowMs: 300_000 },
  },
  checkEscalatingLockout: mocks.checkEscalatingLockout,
  checkRateLimit: mocks.checkRateLimit,
  recordOtpFailureAndCheckLockout: mocks.recordOtpFailureAndCheckLockout,
  resetEscalatingLockout: vi.fn(),
  resetRateLimit: vi.fn(),
}));

vi.mock("../app/actions/auth-action-helpers", () => ({
  NormalizedEmailSchema: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
}));

import {
  verifyOtpCodeCore,
  verifyOtpWithSupabaseClient,
} from "./otp-send-verify-core";
import {
  OTP_CODE_TOO_LONG,
  OTP_CODE_TOO_SHORT,
  VALID_OTP_CODE,
} from "./otp-test-fixtures";

describe("verifyOtpCodeCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseUrl.mockReturnValue("https://example.supabase.co");
    mocks.getSupabaseKey.mockReturnValue("publishable-key");
    mocks.checkEscalatingLockout.mockResolvedValue({ allowed: true });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.createClient.mockReturnValue({
      auth: { verifyOtp: mocks.verifyOtp },
    });
  });

  it("rejects OTP codes outside OTP_CODE_LENGTH before Supabase", async () => {
    const result = await verifyOtpCodeCore(
      "user@example.com",
      OTP_CODE_TOO_SHORT,
      "127.0.0.1"
    );

    expect(result).toEqual({
      success: false,
      error: "Please enter a valid verification code",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects overlong OTP codes before Supabase", async () => {
    const result = await verifyOtpCodeCore(
      "user@example.com",
      OTP_CODE_TOO_LONG,
      "127.0.0.1"
    );

    expect(result).toEqual({
      success: false,
      error: "Please enter a valid verification code",
    });
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("calls Supabase verifyOtp with a valid-length code", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: {
        user: { id: "user-id", email: "user@example.com" },
        session: {
          access_token: "access",
          refresh_token: "refresh",
          expires_at: 123,
        },
      },
      error: null,
    });

    const result = await verifyOtpCodeCore(
      "user@example.com",
      VALID_OTP_CODE,
      "127.0.0.1"
    );

    expect(result.success).toBe(true);
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: VALID_OTP_CODE,
      type: "email",
    });
  });

  it("verifyOtpWithSupabaseClient rejects invalid codes before verifyOtp", async () => {
    const verifyOtp = vi.fn();
    const supabase = {
      auth: { verifyOtp },
    } as unknown as Parameters<typeof verifyOtpWithSupabaseClient>[0];

    const result = await verifyOtpWithSupabaseClient(supabase, {
      normalizedEmail: "user@example.com",
      code: OTP_CODE_TOO_SHORT,
      clientIP: "127.0.0.1",
    });

    expect(result).toEqual({
      success: false,
      error: "Please enter a valid verification code",
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
