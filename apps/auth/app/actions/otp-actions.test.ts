import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const adminCreateUser = vi.fn();
  const adminSignInWithOtp = vi.fn();
  const adminFactory = vi.fn(() => ({
    auth: {
      admin: {
        createUser: adminCreateUser,
      },
      signInWithOtp: adminSignInWithOtp,
    },
  }));

  return {
    adminCreateUser,
    adminFactory,
    adminSignInWithOtp,
    checkEscalatingLockout: vi.fn(),
    checkRateLimit: vi.fn(),
    checkUserPasskeyStatus: vi.fn(),
    createScopedAdminQuery: vi.fn(),
    createServerClient: vi.fn(),
    findUserByEmail: vi.fn(),
    generateCSRFToken: vi.fn(),
    getClientIP: vi.fn(),
    hasEncryptionSetup: vi.fn(),
    logAuthEvent: vi.fn(),
    loggerError: vi.fn(),
    loggerWarn: vi.fn(),
    recordOtpFailureAndCheckLockout: vi.fn(),
    requireCSRFToken: vi.fn(),
    resetEscalatingLockout: vi.fn(),
    resetRateLimit: vi.fn(),
  };
});

vi.mock("@helvety/shared/auth-logger", () => ({
  logAuthEvent: mocks.logAuthEvent,
}));

vi.mock("@helvety/shared/csrf", () => ({
  generateCSRFToken: mocks.generateCSRFToken,
  requireCSRFToken: mocks.requireCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
    logUnexpectedError: mocks.loggerError,
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  ["createAdmin" + "Client"]: mocks.adminFactory,
  ["createScopedAdmin" + "Query"]: mocks.createScopedAdminQuery,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    OTP: { maxRequests: 3, windowMs: 300_000 },
    OTP_VERIFY: { maxRequests: 5, windowMs: 300_000 },
  },
  checkEscalatingLockout: mocks.checkEscalatingLockout,
  checkRateLimit: mocks.checkRateLimit,
  recordOtpFailureAndCheckLockout: mocks.recordOtpFailureAndCheckLockout,
  resetEscalatingLockout: mocks.resetEscalatingLockout,
  resetRateLimit: mocks.resetRateLimit,
}));

vi.mock("./auth-action-helpers", () => ({
  checkUserPasskeyStatus: mocks.checkUserPasskeyStatus,
  getClientIP: mocks.getClientIP,
}));

vi.mock("./encryption-actions", () => ({
  hasEncryptionSetup: mocks.hasEncryptionSetup,
}));

vi.mock("./user-lookup", () => ({
  findUserByEmail: mocks.findUserByEmail,
}));

import { sendVerificationCode, verifyEmailCode } from "./otp-actions";

describe("otp-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireCSRFToken.mockResolvedValue(undefined);
    mocks.getClientIP.mockResolvedValue("203.0.113.15");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.checkEscalatingLockout.mockResolvedValue({ allowed: true });
    mocks.recordOtpFailureAndCheckLockout.mockResolvedValue({ allowed: true });
    mocks.findUserByEmail.mockResolvedValue(null);
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      data: { hasPasskey: false },
      success: true,
    });
    mocks.adminCreateUser.mockResolvedValue({ error: null });
    mocks.adminSignInWithOtp.mockResolvedValue({ error: null });
    mocks.createServerClient.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    });
    mocks.generateCSRFToken.mockResolvedValue(undefined);
    mocks.resetRateLimit.mockResolvedValue(undefined);
    mocks.resetEscalatingLockout.mockResolvedValue(undefined);
    mocks.hasEncryptionSetup.mockResolvedValue({ data: true, success: true });
  });

  it("requires non-EU/EEA confirmation before OTP send", async () => {
    const result = await sendVerificationCode("csrf-token", "new@user.com");

    expect(result).toEqual({
      error:
        "Please confirm that you are not located in the EU/EEA to continue.",
      success: false,
    });
    expect(mocks.adminCreateUser).not.toHaveBeenCalled();
    expect(mocks.adminSignInWithOtp).not.toHaveBeenCalled();
  });

  it("creates missing user and sends OTP when confirmation is provided", async () => {
    mocks.findUserByEmail.mockResolvedValue(null);

    const result = await sendVerificationCode("csrf-token", "new@user.com", {
      nonEUEEAConfirmed: true,
    });

    expect(result).toEqual({
      data: { codeSent: true },
      success: true,
    });
    expect(mocks.adminCreateUser).toHaveBeenCalledOnce();
    expect(mocks.adminSignInWithOtp).toHaveBeenCalledOnce();
  });

  it("sends OTP for existing users as well", async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: "existing-user" });

    const result = await sendVerificationCode(
      "csrf-token",
      "existing@user.com",
      { nonEUEEAConfirmed: true }
    );

    expect(result).toEqual({
      data: { codeSent: true },
      success: true,
    });
    expect(mocks.adminCreateUser).not.toHaveBeenCalled();
    expect(mocks.adminSignInWithOtp).toHaveBeenCalledOnce();
  });

  it("enforces escalating lockout before OTP verification", async () => {
    mocks.checkEscalatingLockout.mockResolvedValue({
      allowed: false,
      retryAfter: 61,
    });

    const result = await verifyEmailCode("csrf-token", "user@ex.com", "123456");

    expect(result).toEqual({
      error:
        "Account temporarily locked due to too many failed attempts. Please try again in 2 minutes.",
      success: false,
    });
  });

  it("rejects malformed OTP codes before Supabase verification", async () => {
    const verifyOtp = vi.fn();
    mocks.createServerClient.mockResolvedValue({
      auth: { verifyOtp },
    });

    const result = await verifyEmailCode("csrf-token", "user@ex.com", "bad");

    expect(result).toEqual({
      error: "Please enter a valid verification code",
      success: false,
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects OTP codes outside 6–8 digit length before Supabase", async () => {
    const verifyOtp = vi.fn();
    mocks.createServerClient.mockResolvedValue({
      auth: { verifyOtp },
    });

    expect(await verifyEmailCode("csrf-token", "user@ex.com", "12345")).toEqual(
      {
        error: "Please enter a valid verification code",
        success: false,
      }
    );
    expect(
      await verifyEmailCode("csrf-token", "user@ex.com", "123456789")
    ).toEqual({
      error: "Please enter a valid verification code",
      success: false,
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("accepts 8-digit OTP and verifies with Supabase", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mocks.createServerClient.mockResolvedValue({
      auth: { verifyOtp },
    });
    mocks.findUserByEmail.mockResolvedValue({ id: "existing-user" });
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      data: { hasPasskey: true },
      success: true,
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ data: true, success: true });

    const result = await verifyEmailCode(
      "csrf-token",
      "user@ex.com",
      "12345678"
    );

    expect(result.success).toBe(true);
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "user@ex.com",
      token: "12345678",
      type: "email",
    });
  });

  it("returns passkey-signin next step after successful OTP for secured users", async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: "existing-user" });
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      data: { hasPasskey: true },
      success: true,
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ data: true, success: true });

    const result = await verifyEmailCode("csrf-token", "user@ex.com", "123456");

    expect(result).toEqual({
      data: {
        isNewUser: false,
        nextStep: "passkey-signin",
        userId: "user-123",
      },
      success: true,
    });
    expect(mocks.generateCSRFToken).toHaveBeenCalledOnce();
    expect(mocks.resetEscalatingLockout).toHaveBeenCalledWith(
      "user@ex.com:203.0.113.15"
    );
  });

  it("returns encryption-setup next step for first-time users", async () => {
    mocks.findUserByEmail.mockResolvedValue(null);
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      data: { hasPasskey: false },
      success: true,
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ data: false, success: true });

    const result = await verifyEmailCode("csrf-token", "user@ex.com", "123456");

    expect(result).toEqual({
      data: {
        isNewUser: true,
        nextStep: "encryption-setup",
        userId: "user-123",
      },
      success: true,
    });
  });

  it("returns encryption-setup when passkey exists but encryption is missing", async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: "existing-user" });
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      data: { hasPasskey: true },
      success: true,
    });
    mocks.hasEncryptionSetup.mockResolvedValue({ data: false, success: true });

    const result = await verifyEmailCode("csrf-token", "user@ex.com", "123456");

    expect(result).toEqual({
      data: {
        isNewUser: false,
        nextStep: "encryption-setup",
        userId: "user-123",
      },
      success: true,
    });
  });
});
