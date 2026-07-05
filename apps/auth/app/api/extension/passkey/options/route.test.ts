import { beforeEach, describe, expect, it, vi } from "vitest";

import { EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR } from "@/lib/extension-auth-errors";

import { POST } from "./route";

import type * as ExtensionPasskey from "@/lib/extension-passkey";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
const USER_ID = "00000000-0000-4000-8000-000000000001";

const mocks = vi.hoisted(() => ({
  authenticateBearerRequest: vi.fn(),
  generateExtensionPasskeyOptions: vi.fn(),
  getTrustedClientIp: vi.fn(),
  headers: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getValidatedAuthEnv: vi.fn(() => ({
    HELVETY_CHROME_EXTENSION_ORIGINS: [ALLOWED_ORIGIN],
  })),
}));

vi.mock("@/lib/extension-bearer-auth", () => ({
  authenticateBearerRequest: mocks.authenticateBearerRequest,
}));

vi.mock("@/lib/extension-passkey", async (importOriginal) => {
  const actual: typeof ExtensionPasskey = await importOriginal();
  return {
    ...actual,
    generateExtensionPasskeyOptions: mocks.generateExtensionPasskeyOptions,
  };
});

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
    warn: vi.fn(),
  },
}));

describe("auth extension passkey options route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getTrustedClientIp.mockReturnValue("127.0.0.1");
    mocks.authenticateBearerRequest.mockResolvedValue({
      ok: true,
      ctx: { user: { id: USER_ID } },
    });
  });

  it("returns 401 when bearer auth fails", async () => {
    mocks.authenticateBearerRequest.mockResolvedValue({
      ok: false,
      error: "Unauthorized",
    });

    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/passkey/options", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("returns 400 for invalid JSON bodies", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/passkey/options", {
        method: "POST",
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid JSON body",
    });
  });

  it("returns 400 when extension origin is not on the env allowlist", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/passkey/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: "chrome-extension://not-on-allowlist000000000000",
          expectedUserId: USER_ID,
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR,
    });
    expect(mocks.generateExtensionPasskeyOptions).not.toHaveBeenCalled();
  });

  it("returns 401 when expectedUserId does not match bearer user", async () => {
    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/passkey/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: ALLOWED_ORIGIN,
          expectedUserId: "00000000-0000-4000-8000-000000000099",
        }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Not authenticated",
    });
    expect(mocks.generateExtensionPasskeyOptions).not.toHaveBeenCalled();
  });

  it("delegates to generateExtensionPasskeyOptions for allowlisted origins", async () => {
    mocks.generateExtensionPasskeyOptions.mockResolvedValue({
      success: true,
      data: { options: { challenge: "c" }, challengeEnvelope: "env" },
    });

    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/passkey/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: ALLOWED_ORIGIN,
          expectedUserId: USER_ID,
          isMobile: true,
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.generateExtensionPasskeyOptions).toHaveBeenCalledWith({
      userId: USER_ID,
      origin: ALLOWED_ORIGIN,
      isMobile: true,
      clientIP: "127.0.0.1",
    });
    expect(mocks.getTrustedClientIp).toHaveBeenCalledWith(expect.any(Headers), {
      requireTrustedProxyInProduction: true,
    });
  });
});
