import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateCSRFToken: vi.fn(),
  signOut: vi.fn(),
  createServerMutatingClient: vi.fn(),
  clearDeviceTrustCookie: vi.fn(),
  clearChallenge: vi.fn(),
}));

vi.mock("@helvety/shared/csrf", () => ({
  validateCSRFToken: mocks.validateCSRFToken,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerMutatingClient: mocks.createServerMutatingClient,
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
    mocks.createServerMutatingClient.mockResolvedValue({
      auth: { signOut: mocks.signOut },
    });
    mocks.clearDeviceTrustCookie.mockResolvedValue(undefined);
    mocks.clearChallenge.mockResolvedValue(undefined);
  });

  it("clears device trust and challenge after successful sign-out", async () => {
    const result = await signOutAction("csrf-token");

    expect(result).toEqual({ success: true });
    expect(mocks.createServerMutatingClient).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalledWith(undefined);
    expect(mocks.clearDeviceTrustCookie).toHaveBeenCalled();
    expect(mocks.clearChallenge).toHaveBeenCalled();
  });

  it("uses global sign-out scope when requested", async () => {
    await signOutAction("csrf-token", true);

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("rejects logout when CSRF validation fails", async () => {
    mocks.validateCSRFToken.mockResolvedValue(false);

    const result = await signOutAction("bad-csrf");

    expect(result).toEqual({ success: false, error: "invalid_csrf" });
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.clearDeviceTrustCookie).not.toHaveBeenCalled();
  });

  it("returns signout_failed when Supabase signOut errors", async () => {
    mocks.signOut.mockResolvedValue({
      error: { message: "network", status: 500 },
    });

    const result = await signOutAction("csrf-token");

    expect(result).toEqual({ success: false, error: "signout_failed" });
    expect(mocks.clearDeviceTrustCookie).not.toHaveBeenCalled();
  });

  it("still succeeds when device trust clear fails after sign-out", async () => {
    mocks.clearDeviceTrustCookie.mockRejectedValue(new Error("cookie write"));

    const result = await signOutAction("csrf-token");

    expect(result).toEqual({ success: true });
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
