import { describe, expect, it, vi } from "vitest";

import { ACTION_LIMITS } from "./constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "./encrypted-prefetch-api";
import {
  ENCRYPTED_PREFETCH_API_MAX_ROWS,
  fetchContactsPrefetchRows,
  fetchLinksLibraryPrefetchRows,
  fetchNotesPrefetchRows,
  fetchTasksPrefetchRows,
} from "./encrypted-prefetch-queries";

describe("encrypted-prefetch-queries", () => {
  it("shares the dashboard row cap with ACTION_LIMITS", () => {
    expect(ENCRYPTED_PREFETCH_API_MAX_ROWS).toBe(
      ACTION_LIMITS.MAX_DASHBOARD_ROWS
    );
  });

  it("queries tasks with explicit prefetch columns and user scope", async () => {
    const overrideTypes = vi.fn().mockResolvedValue({ data: [], error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const eqUser = vi.fn(() => ({ order: orderSort }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = { from: vi.fn(() => ({ select })) };

    await fetchTasksPrefetchRows(supabase as never, "user-1", 10);

    expect(supabase.from).toHaveBeenCalledWith("items");
    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.items);
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(limit).toHaveBeenCalledWith(11);
  });

  it("queries notes with explicit prefetch columns", async () => {
    const overrideTypes = vi.fn().mockResolvedValue({ data: [], error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const eqUser = vi.fn(() => ({ order: orderSort }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = { from: vi.fn(() => ({ select })) };

    await fetchNotesPrefetchRows(supabase as never, "user-1", 10);

    expect(supabase.from).toHaveBeenCalledWith("notes");
    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.notes);
  });

  it("queries contacts with explicit prefetch columns", async () => {
    const overrideTypes = vi.fn().mockResolvedValue({ data: [], error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const orderCategory = vi.fn(() => ({ order: orderSort }));
    const eqUser = vi.fn(() => ({ order: orderCategory }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = { from: vi.fn(() => ({ select })) };

    await fetchContactsPrefetchRows(supabase as never, "user-1", 10);

    expect(supabase.from).toHaveBeenCalledWith("contacts");
    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.contacts);
  });

  it("queries link folders and links in parallel with explicit prefetch columns", async () => {
    const makeQuery = (table: string) => {
      const overrideTypes = vi
        .fn()
        .mockResolvedValue({ data: [], error: null });
      const limit = vi.fn(() => ({ overrideTypes }));
      const orderCreatedAt = vi.fn(() => ({ limit }));
      const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
      const eqUser = vi.fn(() => ({ order: orderSort }));
      const select = vi.fn(() => ({ eq: eqUser }));
      return { table, select };
    };

    const foldersQuery = makeQuery("link_folders");
    const linksQuery = makeQuery("links");
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "link_folders") {
          return { select: foldersQuery.select };
        }
        if (table === "links") {
          return { select: linksQuery.select };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    await fetchLinksLibraryPrefetchRows(supabase as never, "user-1", 10);

    expect(supabase.from).toHaveBeenCalledWith("link_folders");
    expect(supabase.from).toHaveBeenCalledWith("links");
    expect(foldersQuery.select).toHaveBeenCalledWith(
      ENCRYPTED_PREFETCH_COLUMNS.link_folders
    );
    expect(linksQuery.select).toHaveBeenCalledWith(
      ENCRYPTED_PREFETCH_COLUMNS.links
    );
  });
});
