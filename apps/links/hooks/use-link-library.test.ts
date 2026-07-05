import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const libraryMocks = vi.hoisted(() => ({
  encryptLinkInput: vi.fn(),
  encryptFolderInput: vi.fn(),
  createLink: vi.fn(),
  createFolder: vi.fn(),
  decryptLinkRows: vi.fn().mockResolvedValue([]),
  decryptFolderRows: vi.fn().mockResolvedValue([]),
  encryptionState: {
    masterKey: null as CryptoKey | null,
    isUnlocked: false,
  },
}));

vi.mock("@helvety/ui/csrf-provider", () => ({
  useCSRFToken: () => "csrf-token",
}));

vi.mock("@helvety/ui/auth-navigation", () => ({
  reportE2eeActionFailure: vi.fn(),
  reportE2eeHookError: vi.fn(),
  triggerHardLogoutOnce: vi.fn(),
}));

vi.mock("@helvety/ui/sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/app/actions/link-actions", () => ({
  createLink: (...args: unknown[]) => libraryMocks.createLink(...args),
  deleteLink: vi.fn(),
  updateLink: vi.fn(),
}));

vi.mock("@/app/actions/folder-actions", () => ({
  createFolder: (...args: unknown[]) => libraryMocks.createFolder(...args),
  deleteFolder: vi.fn(),
  updateFolder: vi.fn(),
}));

vi.mock("@/app/actions/entity-actions", () => ({
  reorderFolders: vi.fn(),
  reorderLinks: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  useEncryptionContext: () => ({
    masterKey: libraryMocks.encryptionState.masterKey,
    isUnlocked: libraryMocks.encryptionState.isUnlocked,
  }),
  decryptFolderRows: (...args: unknown[]) =>
    libraryMocks.decryptFolderRows(...args),
  decryptLinkRows: (...args: unknown[]) =>
    libraryMocks.decryptLinkRows(...args),
  encryptFolderInput: (...args: unknown[]) =>
    libraryMocks.encryptFolderInput(...args),
  encryptFolderUpdate: vi.fn(),
  encryptLinkInput: (...args: unknown[]) =>
    libraryMocks.encryptLinkInput(...args),
  encryptLinkUpdate: vi.fn(),
}));

import { getLinksApiPath, useLinkLibrary } from "./use-link-library";

describe("getLinksApiPath", () => {
  it("prefixes library API routes with the links base path", () => {
    expect(getLinksApiPath("/api/library")).toBe("/links/api/library");
  });
});

describe("useLinkLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    libraryMocks.encryptionState.masterKey = null;
    libraryMocks.encryptionState.isUnlocked = false;
    libraryMocks.encryptLinkInput.mockResolvedValue({ encrypted: true });
    libraryMocks.encryptFolderInput.mockResolvedValue({ encrypted: true });
    libraryMocks.createLink.mockResolvedValue({
      success: true,
      data: { id: "link-created" },
    });
    libraryMocks.createFolder.mockResolvedValue({
      success: true,
      data: { id: "folder-created" },
    });
  });

  it("starts with an empty library when encryption is locked", () => {
    const { result } = renderHook(() => useLinkLibrary());

    expect(result.current.folders).toEqual([]);
    expect(result.current.links).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(libraryMocks.createLink).not.toHaveBeenCalled();
  });

  describe("save-first create", () => {
    beforeEach(() => {
      libraryMocks.encryptionState.masterKey = {} as CryptoKey;
      libraryMocks.encryptionState.isUnlocked = true;
    });

    it("createLink encrypts at save time with a client UUID and adds the row", async () => {
      const { result } = renderHook(() =>
        useLinkLibrary({
          initialEncryptedFolders: [],
          initialEncryptedLinks: [],
        })
      );

      await act(async () => {
        const created = await result.current.createLink(
          { name: "Helvety", url: "helvety.com" },
          null
        );
        expect(created).toEqual({ id: "link-created" });
      });

      expect(libraryMocks.encryptLinkInput).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Helvety",
          url: "https://helvety.com/",
        }),
        expect.anything(),
        null,
        expect.any(String)
      );
      expect(libraryMocks.createLink).toHaveBeenCalled();
      expect(result.current.links).toHaveLength(1);
      expect(result.current.links[0]?.name).toBe("Helvety");
    });

    it("createFolder encrypts at save time with a client UUID and adds the row", async () => {
      const { result } = renderHook(() =>
        useLinkLibrary({
          initialEncryptedFolders: [],
          initialEncryptedLinks: [],
        })
      );

      await act(async () => {
        const created = await result.current.createFolder(
          { name: "Reading" },
          null
        );
        expect(created).toEqual({ id: "folder-created" });
      });

      expect(libraryMocks.encryptFolderInput).toHaveBeenCalledWith(
        { name: "Reading" },
        expect.anything(),
        null,
        expect.any(String)
      );
      expect(libraryMocks.createFolder).toHaveBeenCalled();
      expect(result.current.folders).toHaveLength(1);
      expect(result.current.folders[0]?.name).toBe("Reading");
    });

    it("does not seed links before createLink is called", () => {
      const { result } = renderHook(() =>
        useLinkLibrary({
          initialEncryptedFolders: [],
          initialEncryptedLinks: [],
        })
      );

      expect(result.current.links).toEqual([]);
      expect(libraryMocks.createLink).not.toHaveBeenCalled();
    });
  });
});
