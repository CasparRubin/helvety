import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getValidDeviceTrustCookie: vi.fn(),
}));

vi.mock("./device-trust-cookie", () => ({
  getValidDeviceTrustCookie: mocks.getValidDeviceTrustCookie,
}));

import { getDeviceTrustStatus } from "./device-trust-actions";

describe("device-trust-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns untrusted when no valid cookie is present", async () => {
    mocks.getValidDeviceTrustCookie.mockResolvedValue(null);

    await expect(getDeviceTrustStatus()).resolves.toEqual({
      success: true,
      data: { trusted: false, userId: null },
    });
  });

  it("returns trusted with user id when cookie is valid", async () => {
    mocks.getValidDeviceTrustCookie.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      v: 1,
    });

    await expect(getDeviceTrustStatus()).resolves.toEqual({
      success: true,
      data: {
        trusted: true,
        userId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
  });
});
