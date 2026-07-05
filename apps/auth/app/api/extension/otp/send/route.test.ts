import { beforeEach, describe, expect, it, vi } from "vitest";

import { EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR } from "@/lib/extension-auth-errors";

import { POST } from "./route";

import type * as ExtensionOtp from "@/lib/extension-otp";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
const BLOCKED_ORIGIN = "chrome-extension://notonthelistabcdefghijklmnop";

const mocks = vi.hoisted(() => ({
  sendExtensionOtp: vi.fn(),
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
    sendExtensionOtp: mocks.sendExtensionOtp,
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

describe("auth extension OTP send route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("127.0.0.1");
    mocks.sendExtensionOtp.mockResolvedValue({
      success: true,
      data: { codeSent: true },
    });
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/send", {
        method: "POST",
        body: "not-json",
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns invalid body when origin is allowlisted but other fields are missing", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ origin: ALLOWED_ORIGIN }),
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid request body",
    });
    expect(mocks.sendExtensionOtp).not.toHaveBeenCalled();
  });

  it("returns allowlist user error when origin is chrome-extension but not allowlisted", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/send", {
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
    expect(mocks.sendExtensionOtp).not.toHaveBeenCalled();
  });

  it("returns generic invalid body when origin is not chrome-extension", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid request body",
    });
  });

  it("returns 503 when trusted client IP is unavailable", async () => {
    mocks.getTrustedClientIp.mockReturnValue(null);
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          nonEUEEAConfirmed: true,
          origin: ALLOWED_ORIGIN,
        }),
      })
    );
    expect(response.status).toBe(503);
  });

  it("delegates to sendExtensionOtp on valid body", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          nonEUEEAConfirmed: true,
          origin: ALLOWED_ORIGIN,
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.sendExtensionOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      nonEUEEAConfirmed: true,
      origin: ALLOWED_ORIGIN,
      clientIP: "127.0.0.1",
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { codeSent: true },
    });
  });
});
