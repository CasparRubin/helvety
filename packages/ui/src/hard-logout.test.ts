import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearAllKeys: vi.fn(),
  clearCachedPRFSalt: vi.fn(),
  redirectToGlobalLogout: vi.fn(),
}));

vi.mock("@helvety/shared/crypto/key-storage", () => ({
  clearAllKeys: mocks.clearAllKeys,
}));

vi.mock("@helvety/shared/crypto/prf-salt-cache", () => ({
  clearCachedPRFSalt: mocks.clearCachedPRFSalt,
}));

vi.mock("@helvety/shared/auth-redirect", () => ({
  redirectToGlobalLogout: mocks.redirectToGlobalLogout,
}));

import { forceHardLogout } from "./hard-logout";

describe("forceHardLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearAllKeys.mockResolvedValue(undefined);
    vi.stubGlobal("window", {
      location: { href: "https://helvety.com/tasks" },
    });
  });

  it("clears local crypto state and redirects to global logout", async () => {
    await forceHardLogout("https://helvety.com/tasks/item-1");

    expect(mocks.clearAllKeys).toHaveBeenCalledOnce();
    expect(mocks.clearCachedPRFSalt).toHaveBeenCalledOnce();
    expect(mocks.redirectToGlobalLogout).toHaveBeenCalledWith(
      "https://helvety.com/tasks/item-1"
    );
  });

  it("uses current location when redirectUri is omitted", async () => {
    await forceHardLogout();

    expect(mocks.redirectToGlobalLogout).toHaveBeenCalledWith(
      "https://helvety.com/tasks"
    );
  });

  it("still redirects when IndexedDB key cleanup fails", async () => {
    mocks.clearAllKeys.mockRejectedValue(new Error("idb unavailable"));

    await forceHardLogout("https://helvety.com/notes");

    expect(mocks.clearCachedPRFSalt).toHaveBeenCalledOnce();
    expect(mocks.redirectToGlobalLogout).toHaveBeenCalledWith(
      "https://helvety.com/notes"
    );
  });

  it("still redirects when PRF salt cache cleanup throws", async () => {
    mocks.clearCachedPRFSalt.mockImplementation(() => {
      throw new Error("storage blocked");
    });

    await forceHardLogout("https://helvety.com/contacts");

    expect(mocks.clearAllKeys).toHaveBeenCalledOnce();
    expect(mocks.redirectToGlobalLogout).toHaveBeenCalledWith(
      "https://helvety.com/contacts"
    );
  });
});
