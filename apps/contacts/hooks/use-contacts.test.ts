import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getContactsApiPath, useContacts } from "./use-contacts";

vi.mock("@helvety/ui/hooks/use-encrypted-sortable-items", () => ({
  useEncryptedSortableItems: vi.fn(() => ({
    items: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    patchLocal: vi.fn(),
  })),
}));

vi.mock("@/lib/crypto", () => ({
  useEncryptionContext: () => ({
    masterKey: {} as CryptoKey,
    isUnlocked: true,
  }),
  decryptContactRows: vi.fn(),
  decryptContactRow: vi.fn(),
  encryptContactInput: vi.fn(),
  encryptContactUpdate: vi.fn(),
}));

describe("getContactsApiPath", () => {
  it("prefixes contact API routes with the contacts base path", () => {
    expect(getContactsApiPath("/api/contacts")).toBe("/contacts/api/contacts");
    expect(getContactsApiPath("/api/contacts/abc-123")).toBe(
      "/contacts/api/contacts/abc-123"
    );
  });
});

describe("useContacts", () => {
  it("delegates list behavior to the shared encrypted sortable hook", () => {
    renderHook(() => useContacts());

    expect(vi.mocked(useEncryptedSortableItems)).toHaveBeenCalledWith(
      expect.objectContaining({
        navigationSource: "contacts-use-contacts",
        perfMeasureName: "contacts:list-refresh-duration",
        loadFailureMessage: "Failed to load contacts",
        reorderEntities: expect.any(Function),
      })
    );
  });

  it("maps shared hook items to contacts in the public API", () => {
    const mockContact = {
      id: "abc-123",
      user_id: "user-1",
      first_name: "Ada",
      last_name: "Lovelace",
      description: null,
      email: null,
      phone: null,
      birthday: null,
      notes: null,
      category_id: "personal",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(useEncryptedSortableItems).mockReturnValueOnce({
      items: [mockContact],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      reorder: vi.fn(),
      patchLocal: vi.fn(),
    });

    const { result } = renderHook(() => useContacts());

    expect(result.current.contacts).toEqual([mockContact]);
  });
});
