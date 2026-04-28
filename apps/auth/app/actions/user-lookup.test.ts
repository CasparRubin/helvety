import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  logUnexpectedError: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

import { findUserByEmail } from "./user-lookup";

describe("findUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({
      data: [{ id: "user-1", email: "a@example.com" }],
      error: null,
    });
    mocks.createAdminClient.mockReturnValue({
      rpc: mocks.rpc,
    });
  });

  it("returns first matching user from RPC result array", async () => {
    const result = await findUserByEmail("a@example.com");
    expect(result).toEqual({ id: "user-1", email: "a@example.com" });
    expect(mocks.rpc).toHaveBeenCalledWith("get_auth_user_by_email", {
      lookup_email: "a@example.com",
    });
  });

  it("returns null and logs when RPC errors", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });
    await expect(findUserByEmail("a@example.com")).resolves.toBeNull();
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error looking up user by email via RPC",
      { message: "boom" }
    );
  });

  it("returns null for malformed RPC payloads", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { id: "user-1" },
      error: null,
    });
    await expect(findUserByEmail("a@example.com")).resolves.toBeNull();
  });
});
