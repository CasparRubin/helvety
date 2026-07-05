import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EXTENSION_INVALID_REQUEST_BODY_ERROR,
  EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR,
} from "@/lib/extension-auth-errors";
import { VALID_OTP_CODE } from "@/lib/otp-test-fixtures";

import { POST } from "./route";

import type * as ExtensionOtp from "@/lib/extension-otp";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
const BLOCKED_ORIGIN = "chrome-extension://notonthelistabcdefghijklmnop";

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
    warn: vi.fn(),
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

  it("returns invalid body when origin is allowlisted but other fields are missing", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ origin: ALLOWED_ORIGIN }),
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: EXTENSION_INVALID_REQUEST_BODY_ERROR,
    });
    expect(mocks.verifyExtensionOtp).not.toHaveBeenCalled();
  });

  it("returns allowlist user error when origin is chrome-extension but not allowlisted", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ origin: BLOCKED_ORIGIN }),
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR,
    });
    expect(mocks.verifyExtensionOtp).not.toHaveBeenCalled();
  });

  it("returns generic inval