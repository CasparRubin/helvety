import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateCSRFToken: vi.fn(),
  signOut: vi.fn(),
  clearDeviceTrustCookie: vi.fn(),
  clearChallenge: vi.fn(),
}));

vi.mock("@helvety/shared/csrf", () => ({
  validateCSRFToken: mocks.validateCSRFToken,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerMutatingClient: vi.fn(async () => ({
    auth: { signOut: mocks.signOut },
  })),
}));

vi.mock("../actions/device-trust-cookie", () => ({
  clearDeviceTrustCookie: mocks.clearDeviceTrustCookie,
}));

vi.mock("../actions/auth-action-helpers", () => ({
  clearChallenge: mocks.clearChallenge,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    warn: vi.fn(),
    logUnexpectedError: vi.fn(),
  },
}));

import { signOutAction } from "./logout-actions";

describe("signOutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validateCSRFToken.mockResolvedValue(true);
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.clearDeviceTrustCookie.mockResolvedValue(undefined);
    mocks.clearChallenge.mockResolvedValue(undefined);
  });

  it("clears device trust and challenge after successful sign-out", async () => {
    const result = await signOutAction("csrf-token");

    expect(result).toEqual({ success: true });
    expect(mocks.signOut).toHaveBeenCalledWith(undefined);
    expect(mocks.clearDeviceTrustCookie).toHaveBeenCalled();
    expect(mocks.clearChallenge).toHaveBeenCalled();
  });

  it("uses global sign-out scope when requested", async () => {
    await signOutAction("csrf-token", true);

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
