import {
  createAuthSuccessContext,
  createOwnedUpdateSupabaseMock,
  sampleEncryptedField,
} from "@helvety/shared/test-utils/action-test-helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  logUnexpectedError: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createLink, deleteLink, updateLink } from "./link-actions";

const LINK_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("links link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createLink returns auth response when rate limit / CSRF fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Invalid CSRF token" },
    });

    const result = await createLink(
      {
        id: LINK_ID,
        encrypted_name: sampleEncryptedField(),
        encrypted_url: sampleEncryptedField(),
        folder_id: null,
      },
      "bad-csrf"
    );

    expect(result).toEqual({ success: false, error: "Invalid CSRF token" });
  });

  it("deleteLink rejects invalid link ids", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: { from: vi.fn() } },
    });

    const result = await deleteLink("not-a-uuid", "csrf");

    expect(result).toEqual({ success: false, error: "Invalid link ID" });
  });

  it("forwards csrfToken to authenticateAndRateLimit on createLink", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: LINK_ID }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    await createLink(
      {
        id: LINK_ID,
        encrypted_name: sampleEncryptedField(),
        encrypted_url: sampleEncryptedField(),
        folder_id: null,
      },
      "csrf-token"
    );

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "links",
    });
  });

  it("creates a link and revalidates the route", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: LINK_ID }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await createLink(
      {
        id: LINK_ID,
        encrypted_name: sampleEncryptedField(),
        encrypted_url: sampleEncryptedField(),
        folder_id: null,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: true, data: { id: LINK_ID } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("rejects invalid encrypted payloads before DB calls on createLink", async () => {
    const insert = vi.fn();
    const supabase = { from: vi.fn(() => ({ insert })) };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { supabase, user: { id: "user-1" } },
    });

    const result = await createLink(
      {
        id: LINK_ID,
        encrypted_name: "not-json",
        encrypted_url: sampleEncryptedField(),
        folder_id: null,
      },
      "csrf-token"
    );

    expect(result).toEqual({ success: false, error: "Invalid link data" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("updates a link and revalidates the route", async () => {
    const supabase = createOwnedUpdateSupabaseMock("links", {
      data: { id: LINK_ID },
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await updateLink(
      { id: LINK_ID, encrypted_name: sampleEncryptedField() },
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("returns not found when update affects zero rows", async () => {
    const supabase = createOwnedUpdateSupabaseMock("links", {
      data: null,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue(
      createAuthSuccessContext(supabase)
    );

    const result = await updateLink(
      { id: LINK_ID, encrypted_name: sampleEncryptedField() },
      "csrf-token"
    );

    expect(result).toEqual({ success: false, error: "Link not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
