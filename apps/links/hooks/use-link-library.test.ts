import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLinksApiPath, useLinkLibrary } from "./use-link-library";

vi.mock("@helvety/ui/csrf-provider", () => ({
  useCSRFToken: () => "csrf-token",
}));

vi.mock("@/lib/crypto", () => ({
  useEncryptionContext: () => ({
    masterKey: null,
    isUnlocked: false,
  }),
  decryptFolderRows: vi.fn(),
  decryptLinkRows: vi.fn(),
  encryptFolderInput: vi.fn(),
  encryptFolderUpdate: vi.fn(),
  encryptLinkInput: vi.fn(),
  encryptLinkUpdate: vi.fn(),
}));

describe("getLinksApiPath", () => {
  it("prefixes library API routes with the links base path", () => {
    expect(getLinksApiPath("/api/library")).toBe("/links/api/library");
  });
});

describe("useLinkLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with an empty library when encryption is locked", () => {
    const { result } = renderHook(() => useLinkLibrary());

    expect(result.current.folders).toEqual([]);
    expect(result.current.links).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
