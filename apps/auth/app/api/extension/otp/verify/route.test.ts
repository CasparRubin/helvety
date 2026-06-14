import { beforeEach, describe, expect, it, vi } from "vitest";

import { VALID_OTP_CODE } from "@/lib/otp-test-fixtures";

import { POST } from "./route";

import type * as ExtensionOtp from "@/lib/extension-otp";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

const mocks = vi.hoisted(() => ({
  verifyExtensionOtp: vi.fn(),
  getTrustedClientIp: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getValidatedAuthEnv: vi.fn(() => ({
    HELVETY_CHROME_EXTENSION_ORIGINS: [ALLOWED_ORIGIN],
  })),
}));

vi.mock("@/lib/extension-otp", async (importOriginal) => {
  const actual: typeof ExtensionOtp = await importOriginal();
  return {
    ...actual,
    verifyExtensionOtp: mocks.verifyExtensionOtp,
  };
});

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

describe("auth extension OTP verify route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("127.0.0.1");
    mocks.verifyExtensionOtp.mockResolvedValue({
      success: true,
      data: {
        access_token: "access",
        refresh_token: "refresh",
        expires_at: 123,
        user: { id: "user-id", email: "user@example.com" },
      },
    });
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/verify", {
        method: "POST",
        body: "not-json",
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns 503 when trusted client IP is unavailable", async () => {
    mocks.getTrustedClientIp.mockReturnValue(null);
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          code: VALID_OTP_CODE,
          origin: ALLOWED_ORIGIN,
        }),
      })
    );
    expect(response.status).toBe(503);
    expect(mocks.verifyExtensionOtp).not.toHaveBeenCalled();
  });

  it("delegates to verifyExtensionOtp on valid body", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          code: VALID_OTP_CODE,
          origin: ALLOWED_ORIGIN,
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.verifyExtensionOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      code: VALID_OTP_CODE,
      origin: ALLOWED_ORIGIN,
      clientIP: "127.0.0.1",
    });
  });
});
