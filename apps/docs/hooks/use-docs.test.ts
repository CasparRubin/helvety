import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDocsApiPath } from "@/lib/docs-zone-path";

import { useDocs } from "./use-docs";

vi.mock("@helvety/ui/csrf-provider", () => ({
  useCSRFToken: () => "csrf-token",
}));

vi.mock("@/lib/crypto", () => ({
  useEncryptionContext: () => ({
    masterKey: null,
    isUnlocked: false,
  }),
  decryptDocListItems: vi.fn(),
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
  });

  it("clears documents when vault access is disabled", async () => {
    const { result } = renderHook(() => useDocs(false));

    await waitFor(() => {
      expect(result.current.documents).toEqual([]);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
