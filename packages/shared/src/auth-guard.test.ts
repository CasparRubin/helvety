import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./cached-server", () => ({
  getCachedAuthLookup: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: () => null,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new MockRedirect(url);
  }),
}));

vi.mock("./request-origin", () => ({
  resolveRequestOrigin: () => null,
}));

/** Thrown by the mocked redirect() to capture the destination URL. */
class MockRedirect {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}

import { requireAuth } from "./auth-guard";
import { getCachedAuthLookup } from "./cached-server";

import type { AuthError, User } from "@supabase/supabase-js";

const mockGetCachedAuthLookup = vi.mocked(getCachedAuthLookup);

afterEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("returns the user when authenticated", async () => {
    const user = { id: "u1", email: "a@b.com" } as unknown as User;
    mockGetCachedAuthLookup.mockResolvedValue({ user, error: null });

    const result = await requireAuth("/tasks");
    expect(result).toBe(user);
  });

  it("redirects to login when no user and no error", async () => {
    mockGetCachedAuthLookup.mockResolvedValue({ user: null, error: null });

    await expect(requireAuth("/tasks")).rejects.toBeInstanceOf(MockRedirect);
    await expect(requireAuth("/tasks")).rejects.toMatchObject({
      url: expect.stringContaining("/auth/login"),
    });
  });

  it("redirects to global logout for hard-logout errors", async () => {
    mockGetCachedAuthLookup.mockResolvedValue({
      user: null,
      error: {
        message: "refresh token not found",
      } as unknown as AuthError,
    });

    await expect(requireAuth("/tasks")).rejects.toBeInstanceOf(MockRedirect);
    await expect(requireAuth("/tasks")).rejects.toMatchObject({
      url: expect.stringContaining("/auth/logout"),
    });
    await expect(requireAuth("/tasks")).rejects.toMatchObject({
      url: expect.stringContaining("scope=global"),
    });
  });

  it("makes only one cached auth lookup (no fallback)", async () => {
    mockGetCachedAuthLookup.mockResolvedValue({
      user: null,
      error: { message: "some error" } as unknown as AuthError,
    });

    await expect(requireAuth("/tasks")).rejects.toThrow(MockRedirect);
    expect(mockGetCachedAuthLookup).toHaveBeenCalledTimes(1);
  });
});
