import { describe, expect, it, vi } from "vitest";

vi.mock("./auth-guard", () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from "./auth-guard";
import { requireE2eeAppPageAuth } from "./e2ee-page-auth";

import type { User } from "@supabase/supabase-js";

describe("requireE2eeAppPageAuth", () => {
  it("delegates to requireAuth with the app path", async () => {
    const user = { id: "u1" } as unknown as User;
    vi.mocked(requireAuth).mockResolvedValue(user);

    const result = await requireE2eeAppPageAuth("/tasks");

    expect(requireAuth).toHaveBeenCalledWith("/tasks");
    expect(result).toBe(user);
  });
});
