import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDocsApiPath } from "@/lib/docs-zone-path";

import { useDocs } from "./use-docs";

const mocks = vi.hoisted(() => ({
  triggerHardLogoutOnce: vi.fn(),
  reportE2eeActionFailure: vi.fn(() => false),
  reportE2eeHookError: vi.fn(),
  decryptDocListItems: vi.fn(),
}));

let encryptionState = {
  masterKey: null as object | null,
  isUnlocked: false,
};

vi.mock("@helvety/ui/csrf-provider", () => ({
  useCSRFToken: () => "csrf-token",
}));

vi.mock("@helvety/ui/auth-navigation", () => ({
  reportE2eeActionFailure: mocks.reportE2eeActionFailure,
  reportE2eeHookError: mocks.reportE2eeHookError,
  triggerHardLogoutOnce: mocks.triggerHardLogoutOnce,
}));

vi.mock("@/lib/crypto", () => ({
  useEncryptionContext: () => encryptionState,
  decryptDocListItems: mocks.decryptDocListItems,
  decryptDocRow: vi.fn(),
  encryptDocInput: vi.fn(),
  encryptDocUpdate: vi.fn(),
}));

describe("getDocsApiPath", () => {
  it("prefixes docs API routes with the docs base path", () => {
    expect(getDocsApiPath("/api/docs")).toBe("/docs/api/docs");
    expect(getDocsApiPath("/api/docs/abc-123")).toBe("/docs/api/docs/abc-123");
  });
});

describe("useDocs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    encryptionState = { masterKey: null, isUnlocked: false };
    mocks.decryptDocListItems.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears documents when vault access is disabled", async () => {
    const { result } = renderHook(() => useDocs(false));

    await waitFor(() => {
      expect(result.current.documents).toEqual([]);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("loads and decrypts documents when vault access is enabled", async () => {
    const masterKey = { key: "test" };
    encryptionState = { masterKey, isUnlocked: true };
    const rows = [{ id: "doc-1" }];
    const decrypted = [
      { id: "doc-1", title: "Draft", updated_at: "2026-01-01" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ success: true, data: rows }),
      })
    );
    mocks.decryptDocListItems.mockResolvedValue(decrypted);

    const { result } = renderHook(() => useDocs(true));

    await waitFor(() => {
      expect(result.current.documents).toEqual(decrypted);
    });
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(getDocsApiPath("/api/docs"), {
      method: "GET",
      cache: "no-store",
    });
  });

  it("sets error state when list fetch fails without auth logout", async () => {
    const masterKey = { key: "test" };
    encryptionState = { masterKey, isUnlocked: true };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: false,
            error: "Vault list unavailable",
          }),
      })
    );

    const { result } = renderHook(() => useDocs(true));

    await waitFor(() => {
      expect(result.current.error).toBe("Vault list unavailable");
    });
    expect(result.current.documents).toEqual([]);
    expect(mocks.triggerHardLogoutOnce).not.toHaveBeenCalled();
  });

  it("triggers hard logout when list fetch reports an auth failure", async () => {
    const masterKey = { key: "test" };
    encryptionState = { masterKey, isUnlocked: true };
    mocks.reportE2eeActionFailure.mockReturnValueOnce(true);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            success: false,
            error: "Session expired",
          }),
      })
    );

    const { result } = renderHook(() => useDocs(true));

    await waitFor(() => {
      expect(mocks.triggerHardLogoutOnce).toHaveBeenCalled();
    });
    expect(result.current.documents).toEqual([]);
  });

  it("sets isRefreshing during manual refresh while keeping prior documents", async () => {
    const masterKey = { key: "test" };
    encryptionState = { masterKey, isUnlocked: true };
    const decrypted = [
      { id: "doc-1", title: "Draft", updated_at: "2026-01-01" },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ success: true, data: [{ id: "doc-1" }] }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: async () =>
                    JSON.stringify({
                      success: true,
                      data: [{ id: "doc-1" }],
                    }),
                }),
              50
            );
          })
      );
    vi.stubGlobal("fetch", fetchMock);
    mocks.decryptDocListItems.mockResolvedValue(decrypted);

    const { result } = renderHook(() => useDocs(true));

    await waitFor(() => {
      expect(result.current.documents).toEqual(decrypted);
    });

    const refreshPromise = result.current.refresh();

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true);
    });
    expect(result.current.documents).toEqual(decrypted);

    await refreshPromise;

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it("refresh retries list fetch after a prior failure", async () => {
    const masterKey = { key: "test" };
    encryptionState = { masterKey, isUnlocked: true };
    const decrypted = [
      { id: "doc-1", title: "Draft", updated_at: "2026-01-01" },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ success: false, error: "Temporary failure" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ success: true, data: [{ id: "doc-1" }] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    mocks.decryptDocListItems.mockResolvedValue(decrypted);

    const { result } = renderHook(() => useDocs(true));

    await waitFor(() => {
      expect(result.current.error).toBe("Temporary failure");
    });

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.documents).toEqual(decrypted);
      expect(result.current.error).toBeNull();
    });
  });
});
