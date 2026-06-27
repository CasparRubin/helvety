import { describe, expect, it, vi } from "vitest";

vi.mock("./auth-guard", () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from "./auth-guard";
import {
  requireE2eeAppPageAuth,
  requiresE2eeBrowserUnlock,
  requiresE2eeDeviceTrust,
} from "./e2ee-page-auth";

import type { User } from "@supabase/supabase-js";

describe("requiresE2eeDeviceTrust", () => {
  it("returns true for E2EE vault rate-limit prefixes", () => {
    expect(requiresE2eeDeviceTrust("tasks")).toBe(true);
    expect(requiresE2eeDeviceTrust("export")).toBe(true);
    expect(requiresE2eeDeviceTrust("contact-links")).toBe(true);
  });

  it("returns false for non-E2EE prefixes", () => {
    expect(requiresE2eeDeviceTrust("store")).toBe(false);
    expect(requiresE2eeDeviceTrust("test")).toBe(false);
  });
});

describe("requireE2eeAppPageAuth", () => {
  it("delegates to requireAuth with the app path", async () => {
    const user = { id: "u1" } as unknown as User;
    vi.mocked(requireAuth).mockResolvedValue(user);

    const result = await requireE2eeAppPageAuth("/tasks");

    expect(requireAuth).toHaveBeenCalledWith("/tasks", {
      requireDeviceTrust: true,
    });
    expect(result).toBe(user);
  });
});

describe("requiresE2eeBrowserUnlock", () => {
  it("returns true for notes, tasks, contacts, and links roots and subpaths", () => {
    expect(requiresE2eeBrowserUnlock("https://helvety.com/notes")).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/notes/")).toBe(true);
    expect(
      requiresE2eeBrowserUnlock("https://helvety.com/notes/item/abc")
    ).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/tasks")).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/tasks/foo")).toBe(
      true
    );
    expect(requiresE2eeBrowserUnlock("https://helvety.com/contacts")).toBe(
      true
    );
    expect(requiresE2eeBrowserUnlock("http://localhost:3001/notes")).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/links")).toBe(true);
    expect(
      requiresE2eeBrowserUnlock("https://helvety.com/links?folder=abc")
    ).toBe(true);
  });

  it("returns false for non-E2EE paths", () => {
    expect(requiresE2eeBrowserUnlock("https://helvety.com/")).toBe(false);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/auth/login")).toBe(
      false
    );
    expect(requiresE2eeBrowserUnlock("https://helvety.com/store")).toBe(false);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/pdf")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(requiresE2eeBrowserUnlock("not a url")).toBe(false);
  });
});
