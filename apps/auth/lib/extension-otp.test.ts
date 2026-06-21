import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAllowedChromeExtensionOrigin: vi.fn(),
  sendOtpVerificationCodeCore: vi.fn(),
  verifyOtpCodeCore: vi.fn(),
  mintExtensionWeeklyProof: vi.fn(),
}));

vi.mock("@/lib/chrome-extension-origin", () => ({
  isAllowedChromeExtensionOrigin: mocks.isAllowedChromeExtensionOrigin,
}));

vi.mock("@/lib/otp-send-verify-core", () => ({
  sendOtpVerificationCodeCore: mocks.sendOtpVerificationCodeCore,
  verifyOtpCodeCore: mocks.verifyOtpCodeCore,
}));

vi.mock("@helvety/shared/extension-weekly-proof-server", () => ({
  mintExtensionWeeklyProof: mocks.mintExtensionWeeklyProof,
}));

import { sendExtensionOtp, verifyExtensionOtp } from "./extension-otp";
import { VALID_OTP_CODE } from "./otp-test-fixtures";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

describe("extension-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(true);
    mocks.mintExtensionWeeklyProof.mockReturnValue("signed-weekly-proof");
  });

  it("rejects send when origin is not allowlisted", async () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(false);

    const result = await sendExtensionOtp({
      email: "user@example.com",
      nonEUEEAConfirmed: true,
      origin: "chrome-extension://blocked",
      clientIP: "127.0.0.1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("HELVETY_CHROME_EXTENSION_ORIGINS");
    }
    expect(mocks.sendOtpVerificationCodeCore).not.toHaveBeenCalled();
  });

  it("delegates send to otp core after attestation and origin checks", async () => {
    mocks.sendOtpVerificationCodeCore.mockResolvedValue({ success: true });

    const result = await sendExtensionOtp({
      email: "user@example.com",
      nonEUEEAConfirmed: true,
      origin: ALLOWED_ORIGIN,
      clientIP: "127.0.0.1",
    });

    expect(mocks.sendOtpVerificationCodeCore).toHaveBeenCalledWith(
      "user@example.com",
      "127.0.0.1",
      { nonEUEEAConfirmed: true }
    );
    expect(result).toEqual({ success: true, data: { codeSent: true } });
  });

  it("passes through otp core send failures", async () => {
    mocks.sendOtpVerificationCodeCore.mockResolvedValue({
      success: false,
      error:
        "Please confirm that you are not located in the EU/EEA to continue.",
    });

    const result = await sendExtensionOtp({
      email: "user@example.com",
      nonEUEEAConfirmed: true,
      origin: ALLOWED_ORIGIN,
      clientIP: "127.0.0.1",
    });

    expect(result).toEqual({
      success: false,
      error:
        "Please confirm that you are not located in the EU/EEA to continue.",
    });
  });

  it("rejects verify when origin is not allowlisted", async () => {
    mocks.isAllowedChromeExtensionOrigin.mockReturnValue(false);

    const result = await verifyExtensionOtp({
      email: "user@example.com",
      code: VALID_OTP_CODE,
      origin: "chrome-extension://blocked",
      clientIP: "127.0.0.1",
    });

    expect(result.success).toBe(false);
    expect(mocks.verifyOtpCodeCore).not.toHaveBeenCalled();
  });

  it("delegates verify to otp core and returns session payload", async () => {
    const session = {
      access_token: "access",
      refresh_token: "refresh",
      expires_at: 123,
      user: { id: "user-id", email: "user@example.com" },
    };
    mocks.verifyOtpCodeCore.mockResolvedValue({ success: true, data: session });

    const result = await verifyExtensionOtp({
      email: "user@example.com",
      code: VALID_OTP_CODE,
      origin: ALLOWED_ORIGIN,
      clientIP: "127.0.0.1",
    });

    expect(mocks.verifyOtpCodeCore).toHaveBeenCalledWith(
      "user@example.com",
      VALID_OTP_CODE,
      "127.0.0.1"
    );
    expect(result).toEqual({
      success: true,
      data: { ...session, weekly_proof: "signed-weekly-proof" },
    });
    expect(mocks.mintExtensionWeeklyProof).toHaveBeenCalledWith("user-id");
  });
});
