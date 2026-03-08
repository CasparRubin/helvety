import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
}));

import {
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "./contact-link-actions";

/** Builds a minimal Supabase mock for item-contact link actions. */
function createSupabaseMock() {
  const linkSelectReturns = vi.fn().mockResolvedValue({
    data: [{ id: "link-1", item_id: "item-1", contact_id: "contact-1" }],
    error: null,
  });
  const linkOrder = vi.fn(() => ({ returns: linkSelectReturns }));
  const linkEqItem = vi.fn(() => ({ order: linkOrder }));
  const linkEqUser = vi.fn(() => ({ eq: linkEqItem }));
  const linkSelect = vi.fn(() => ({ eq: linkEqUser }));

  const contactSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "contact-1" }, error: null });
  const contactEqUser = vi.fn(() => ({ single: contactSingle }));
  const contactEqId = vi.fn(() => ({ eq: contactEqUser }));
  const contactSelect = vi.fn(() => ({ eq: contactEqId }));

  const itemSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "item-1" }, error: null });
  const itemEqUser = vi.fn(() => ({ single: itemSingle }));
  const itemEqId = vi.fn(() => ({ eq: itemEqUser }));
  const itemSelect = vi.fn(() => ({ eq: itemEqId }));

  const insertSingle = vi
    .fn()
    .mockResolvedValue({ data: { id: "new-link" }, error: null });
  const insertSelect = vi.fn(() => ({ single: insertSingle }));
  const insert = vi.fn(() => ({ select: insertSelect }));

  const deleteEqUser = vi.fn().mockResolvedValue({ error: null });
  const deleteEqId = vi.fn(() => ({ eq: deleteEqUser }));
  const deleteFn = vi.fn(() => ({ eq: deleteEqId }));

  const from = vi.fn((table: string) => {
    if (table === "item_contact_links") {
      return { select: linkSelect, insert, delete: deleteFn };
    }
    if (table === "contacts") {
      return { select: contactSelect };
    }
    if (table === "items") {
      return { select: itemSelect };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from };
}

describe("tasks contact-link-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates item id before auth for getItemContactLinks", async () => {
    const result = await getItemContactLinks("invalid-id");
    expect(result).toEqual({ success: false, error: "Invalid item ID" });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("uses item_contact_links for get/link/unlink flow", async () => {
    const supabase = createSupabaseMock();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const links = await getItemContactLinks(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const linked = await linkContact(
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
      "csrf-token"
    );
    const unlinked = await unlinkContact(
      "550e8400-e29b-41d4-a716-446655440002",
      "csrf-token"
    );

    expect(links.success).toBe(true);
    expect(linked).toEqual({ success: true, data: { id: "new-link" } });
    expect(unlinked).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith("item_contact_links");
  });
});
