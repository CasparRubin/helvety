import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

import type * as ExtensionPasskey from "@/lib/extension-passkey";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
const USER_ID = "00000000-0000-4000-8000-000000000001";

const mocks = vi.hoisted(() => ({
  authenticateBearerRequest: vi.fn(),
  verifyExtensionPasskey: vi.fn(),
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
    verifyExtensionPasskey: mocks.verifyExtensionPasskey,
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
  },
}));

describe("auth extension passkey verify route", () => {
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
      new Request("https://auth.helvety.com/api/extension/passkey/verify", {
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
      new Request("https://auth.helvety.com/api/extension/passkey/verify", {
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
      new Request("https://auth.helvety.com/api/extension/passkey/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: "chrome-extension://not-on-allowlist000000000000",
          challengeEnvelope: "envelope",
          credential: {
            id: "cred",
            rawId: "raw",
            type: "public-key",
            response: {
              clientDataJSON: "Y2Rq",
              authenticatorData: "YWR",
              signature: "c2d",
            },
          },
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error:
        "Extension id is not allowlisted on helvety-auth (HELVETY_CHROME_EXTENSION_ORIGINS). Add the id from About → Extension ID on Vercel, then redeploy.",
    });
    expect(mocks.verifyExtensionPasskey).not.toHaveBeenCalled();
  });

  it("delegates to verifyExtensionPasskey for allowlisted origins", async () => {
    mocks.verifyExtensionPasskey.mockResolvedValue({
      success: true,
      data: { userId: USER_ID },
    });

    const response = await POST(
      new Request("https://auth.helvety.com/api/extension/passkey/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: ALLOWED_ORIGIN,
          challengeEnvelope: "envelope",
          credential: {
            id: "cred",
            rawId: "raw",
            type: "public-key",
            response: {
              clientDataJSON: "Y2Rq",
              authenticatorData: "YWR",
              signature: "c2d",
            },
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.verifyExtensionPasskey).toHaveBeenCalledWith({
      userId: USER_ID,
      origin: ALLOWED_ORIGIN,
      challengeEnvelope: "envelope",
      credential: expect.objectContaining({ id: "cred" }),
      clientIP: "127.0.0.1",
    });
    expect(mocks.getTrustedClientIp).toHaveBeenCalledWith(expect.any(Headers), {
      requireTrustedProxyInProduction: false,
    });
  });
});
