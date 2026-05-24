import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateBearerRequest: vi.fn(),
  generateExtensionPasskeyOptions: vi.fn(),
  getTrustedClientIp: vi.fn(),
  headers: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@/lib/extension-bearer-auth", () => ({
  authenticateBearerRequest: mocks.authenticateBearerRequest,
}));

vi.mock("@/lib/extension-passkey", () => ({
  generateExtensionPasskeyOptions: mocks.generateExtensionPasskeyOptions,
}));

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

import { POST } from "./route";

describe("auth extension passkey options route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getTrustedClientIp.mockReturnValue("127.0.0.1");
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
    mocks.authenticateBearerRequest.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" } },
    });

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
});
