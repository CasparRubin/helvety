"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { patchEntityInList } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import {
  reportE2eeActionFailure,
  reportE2eeHookError,
  triggerHardLogoutOnce,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { toast } from "@helvety/ui/sonner";
import { useCallback, useEffect, useRef, useState } from "react";

import { reorderFolders, reorderLinks } from "@/app/actions/entity-actions";
import {
  createFolder,
  deleteFolder,
  updateFolder,
} from "@/app/actions/folder-actions";
import { createLink, deleteLink, updateLink } from "@/app/actions/link-actions";
import {
  decryptFolderRows,
  decryptLinkRows,
  encryptFolderInput,
  encryptFolderUpdate,
  encryptLinkInput,
  encryptLinkUpdate,
  useEncryptionContext,
} from "@/lib/crypto";
import { canMoveFolderToParent } from "@/lib/link-tree";
import {
  normalizeBookmarkUrl,
  resolveLinkDisplayName,
} from "@/lib/url-normalize";

import type { TreeDropAction } from "@/lib/link-tree-dnd";
import type {
  ActionResponse,
  FolderReorderUpdate,
  Link,
  LinkFolder,
  LinkFolderInput,
  LinkFolderRow,
  LinkInput,
  LinkReorderUpdate,
  LinkRow,
  LinksDashboardData,
} from "@/lib/types";

const LINKS_BASE_PATH = "/links";

/** Prefixes API paths with the links app base path for gateway rewrites. */
export function getLinksApiPath(path: string): string {
  return `${LINKS_BASE_PATH}${path}`;
}

/** Loads encrypted folder and link rows from the library API. */
async function fetchLibrary(): Promise<ActionResponse<LinksDashboardData>> {
  const response = await fetch(getLinksApiPath("/api/library"), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<LinksDashboardData>(
    response,
    "Failed to load library"
  );
}

/** Optional SSR-prefetched encrypted rows for the initial decrypt. */
interface UseLinkLibraryOptions {
  initialEncryptedFolders?: LinkFolderRow[];
  initialEncryptedLinks?: LinkRow[];
}

/** Decrypted library state and mutation helpers returned by `useLinkLibrary`. */
interface UseLinkLibraryReturn {
  folders: LinkFolder[];
  links: Link[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createFolder: (
    input: LinkFolderInput,
    parentFolderId: string | null
  ) => Promise<{ id: string } | null>;
  updateFolder: (
    id: string,
    input: Partial<LinkFolderInput> & {
      parent_folder_id?: string | null;
      sort_order?: number;
    }
  ) => Promise<boolean>;
  removeFolder: (id: string) => Promise<boolean>;
  createLink: (
    input: LinkInput,
    folderId: string | null
  ) => Promise<{ id: string } | null>;
  updateLink: (
    id: string,
    input: Partial<LinkInput> & {
      folder_id?: string | null;
      sort_order?: number;
    }
  ) => Promise<boolean>;
  removeLink: (id: string) => Promise<boolean>;
  /** Add an optimistic link draft without a server call. */
  seedLinkDraft: (
    id: string,
    input: LinkInput,
    folderId: string | null
  ) => void;
  /** Remove a link draft from the in-memory list. */
  removeLinkDraft: (id: string) => void;
  /** Create a link with a pre-generated client id (open-first drafts). */
  createLinkWithId: (
    id: string,
    input: LinkInput,
    folderId: string | null
  ) => Promise<{ id: string } | null>;
  /** Add an optimistic folder draft without a server call. */
  seedFolderDraft: (
    id: string,
    input: LinkFolderInput,
    parentFolderId: string | null
  ) => void;
  /** Remove a folder draft from the in-memory list. */
  removeFolderDraft: (id: string) => void;
  /** Create a folder with a pre-generated client id (open-first drafts). */
  createFolderWithId: (
    id: string,
    input: LinkFolderInput,
    parentFolderId: string | null
  ) => Promise<{ id: string } | null>;
  applyTreeDrop: (action: TreeDropAction) => Promise<boolean>;
}

/** Client hook for the links library: decrypt, CRUD, refresh, and tree drag-and-drop. */
export function useLinkLibrary(
  options?: UseLinkLibraryOptions
): UseLinkLibraryReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [folders, setFolders] = useState<LinkFolder[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialDataConsumedRef = useRef(false);
  const latestRefreshTokenRef = useRef(0);
  const foldersLengthRef = useRef(0);
  const linksLengthRef = useRef(0);
  foldersLengthRef.current = folders.length;
  linksLengthRef.current = links.length;
  const pendingLinkDraftIdsRef = useRef<Set<string>>(new Set());
  const pendingFolderDraftIdsRef = useRef<Set<string>>(new Set());
  const abortedLinkDraftIdsRef = useRef<Set<string>>(new Set());
  const abortedFolderDraftIdsRef = useRef<Set<string>>(new Set());

  const applyDecrypted = useCallback(
    async (data: LinksDashboardData) => {
      if (!masterKey) {
        return;
      }
      const [decryptedFolders, decryptedLinks] = await Promise.all([
        decryptFolderRows(data.folders, masterKey),
        decryptLinkRows(data.links, masterKey),
      ]);
      const folderServerIds = new Set(decryptedFolders.map((f) => f.id));
      const linkServerIds = new Set(decryptedLinks.map((l) => l.id));
      setFolders((prev) => {
        const pending = prev.filter(
          (f) =>
            pendingFolderDraftIdsRef.current.has(f.id) &&
            !folderServerIds.has(f.id)
        );
        if (pending.length === 0) {
          return decryptedFolders;
        }
        return [...decryptedFolders, ...pending].toSorted(
          (a, b) => a.sort_order - b.sort_order
        );
      });
      setLinks((prev) => {
        const pending = prev.filter(
          (l) =>
            pendingLinkDraftIdsRef.current.has(l.id) && !linkServerIds.has(l.id)
        );
        if (pending.length === 0) {
          return decryptedLinks;
        }
        return [...decryptedLinks, ...pending].toSorted(
          (a, b) => a.sort_order - b.sort_order
        );
      });
    },
    [masterKey]
  );

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setFolders([]);
      setLinks([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    const hasData = foldersLengthRef.current > 0 || linksLengthRef.current > 0;
    if (hasData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetchLibrary();
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          reportE2eeActionFailure(result.error, {
            source: "links-use-library",
            fallback: "Failed to load library",
            setError,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        return;
      }
      await applyDecrypted(result.data);
    } catch (err) {
      reportE2eeHookError(err, {
        source: "links-use-library",
        fallback: "Failed to load library",
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [applyDecrypted, isUnlocked, masterKey]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!isUnlocked || !masterKey) return;

    if (
      options?.initialEncryptedFolders !== undefined &&
      options.initialEncryptedLinks !== undefined
    ) {
      if (!initialDataConsumedRef.current) {
        initialDataConsumedRef.current = true;
        void applyDecrypted({
          folders: options.initialEncryptedFolders,
          links: options.initialEncryptedLinks,
        }).finally(() => {
          setIsLoading(false);
        });
      }
      return;
    }

    void refreshRef.current();
  }, [
    applyDecrypted,
    isUnlocked,
    masterKey,
    options?.initialEncryptedFolders,
    options?.initialEncryptedLinks,
  ]);

  const seedFolderDraft = useCallback(
    (id: string, input: LinkFolderInput, parentFolderId: string | null) => {
      pendingFolderDraftIdsRef.current.add(id);
      setFolders((prev) => {
        const maxOrder = prev
          .filter((f) => (f.parent_folder_id ?? null) === parentFolderId)
          .reduce((max, f) => Math.max(max, f.sort_order), -1);
        return [
          ...prev,
          {
            id,
            user_id: prev[0]?.user_id ?? "",
            name: input.name,
            parent_folder_id: parentFolderId,
            sort_order: maxOrder + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ].toSorted((a, b) => a.sort_order - b.sort_order);
      });
    },
    []
  );

  const removeFolderDraft = useCallback((id: string) => {
    pendingFolderDraftIdsRef.current.delete(id);
    abortedFolderDraftIdsRef.current.add(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const createFolderWithId = useCallback(
    async (
      id: string,
      input: LinkFolderInput,
      parentFolderId: string | null
    ): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "links-use-library");
        return null;
      }
      try {
        const encrypted = await encryptFolderInput(
          input,
          masterKey,
          parentFolderId,
          id
        );
        const result = await createFolder(encrypted, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "links-use-library",
            fallback: "Failed to create folder",
          });
          return null;
        }
        const wasAborted = abortedFolderDraftIdsRef.current.has(id);
        abortedFolderDraftIdsRef.current.delete(id);
        pendingFolderDraftIdsRef.current.delete(id);
        setFolders((prev) => {
          if (prev.some((f) => f.id === id)) {
            return prev;
          }
          if (wasAborted) {
            return prev;
          }
          const maxOrder = prev
            .filter((f) => (f.parent_folder_id ?? null) === parentFolderId)
            .reduce((max, f) => Math.max(max, f.sort_order), -1);
          return [
            ...prev,
            {
              id: result.data.id,
              user_id: prev[0]?.user_id ?? "",
              name: input.name,
              parent_folder_id: parentFolderId,
              sort_order: maxOrder + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ].toSorted((a, b) => a.sort_order - b.sort_order);
        });
        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create folder";
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [csrfToken, masterKey]
  );

  const createFolderFn = useCallback(
    async (
      input: LinkFolderInput,
      parentFolderId: string | null
    ): Promise<{ id: string } | null> => {
      return createFolderWithId(crypto.randomUUID(), input, parentFolderId);
    },
    [createFolderWithId]
  );

  const updateFolderFn = useCallback(
    async (
      id: string,
      input: Partial<LinkFolderInput> & {
        parent_folder_id?: string | null;
        sort_order?: number;
      }
    ): Promise<boolean> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "links-use-library");
        return false;
      }
      try {
        const encrypted = await encryptFolderUpdate(id, input, masterKey);
        const result = await updateFolder(
          {
            id,
            ...encrypted,
            ...(input.parent_folder_id !== undefined
              ? { parent_folder_id: input.parent_folder_id }
              : {}),
            ...(input.sort_order !== undefined
              ? { sort_order: input.sort_order }
              : {}),
          },
          csrfToken
        );
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "links-use-library",
            fallback: "Failed to update folder",
          });
          return false;
        }
        setFolders((prev) =>
          patchEntityInList(prev, id, {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.parent_folder_id !== undefined
              ? { parent_folder_id: input.parent_folder_id }
              : {}),
            ...(input.sort_order !== undefined
              ? { sort_order: input.sort_order }
              : {}),
          })
        );
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update folder";
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken, masterKey]
  );

  const removeFolderFn = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await deleteFolder(id, csrfToken);
      if (!result.success) {
        reportE2eeActionFailure(result.error, {
          source: "links-use-library",
          fallback: "Failed to delete folder",
        });
        return false;
      }
      await refresh();
      return true;
    },
    [csrfToken, refresh]
  );

  const seedLinkDraft = useCallback(
    (id: string, input: LinkInput, folderId: string | null) => {
      pendingLinkDraftIdsRef.current.add(id);
      setLinks((prev) => {
        const maxOrder = prev
          .filter((l) => (l.folder_id ?? null) === folderId)
          .reduce((max, l) => Math.max(max, l.sort_order), -1);
        return [
          ...prev,
          {
            id,
            user_id: prev[0]?.user_id ?? "",
            name: resolveLinkDisplayName(input.name, input.url),
            url: input.url,
            folder_id: folderId,
            sort_order: maxOrder + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ].toSorted((a, b) => a.sort_order - b.sort_order);
      });
    },
    []
  );

  const removeLinkDraft = useCallback((id: string) => {
    pendingLinkDraftIdsRef.current.delete(id);
    abortedLinkDraftIdsRef.current.add(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const createLinkWithId = useCallback(
    async (
      id: string,
      input: LinkInput,
      folderId: string | null
    ): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "links-use-library");
        return null;
      }
      const normalized = normalizeBookmarkUrl(input.url);
      if (!normalized.ok) {
        toast.error(normalized.error, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
      try {
        const payload: LinkInput = {
          name: resolveLinkDisplayName(input.name, normalized.url),
          url: normalized.url,
        };
        const encrypted = await encryptLinkInput(
          payload,
          masterKey,
          folderId,
          id
        );
        const result = await createLink(encrypted, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "links-use-library",
            fallback: "Failed to create link",
          });
          return null;
        }
        const wasAborted = abortedLinkDraftIdsRef.current.has(id);
        abortedLinkDraftIdsRef.current.delete(id);
        pendingLinkDraftIdsRef.current.delete(id);
        setLinks((prev) => {
          if (prev.some((l) => l.id === id)) {
            return prev;
          }
          if (wasAborted) {
            return prev;
          }
          const maxOrder = prev
            .filter((l) => (l.folder_id ?? null) === folderId)
            .reduce((max, l) => Math.max(max, l.sort_order), -1);
          return [
            ...prev,
            {
              id: result.data.id,
              user_id: prev[0]?.user_id ?? "",
              name: payload.name,
              url: payload.url,
              folder_id: folderId,
              sort_order: maxOrder + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ].toSorted((a, b) => a.sort_order - b.sort_order);
        });
        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create link";
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [csrfToken, masterKey]
  );

  const createLinkFn = useCallback(
    async (
      input: LinkInput,
      folderId: string | null
    ): Promise<{ id: string } | null> => {
      return createLinkWithId(crypto.randomUUID(), input, folderId);
    },
    [createLinkWithId]
  );

  const updateLinkFn = useCallback(
    async (
      id: string,
      input: Partial<LinkInput> & {
        folder_id?: string | null;
        sort_order?: number;
      }
    ): Promise<boolean> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "links-use-library");
        return false;
      }
      let urlUpdate: string | undefined;
      if (input.url !== undefined) {
        const normalized = normalizeBookmarkUrl(input.url);
        if (!normalized.ok) {
          toast.error(normalized.error, { duration: TOAST_DURATIONS.ERROR });
          return false;
        }
        urlUpdate = normalized.url;
      }
      try {
        const existing = links.find((l) => l.id === id);
        const finalUrl = urlUpdate ?? existing?.url;
        const encryptPayload: Partial<LinkInput> = {};
        if (input.name !== undefined || urlUpdate !== undefined) {
          if (!finalUrl) {
            toast.error("URL is required", { duration: TOAST_DURATIONS.ERROR });
            return false;
          }
          encryptPayload.name = resolveLinkDisplayName(
            input.name ?? "",
            finalUrl
          );
        }
        if (urlUpdate !== undefined) {
          encryptPayload.url = urlUpdate;
        }
        const encrypted = await encryptLinkUpdate(
          id,
          encryptPayload,
          masterKey
        );
        const result = await updateLink(
          {
            id,
            ...encrypted,
            ...(input.folder_id !== undefined
              ? { folder_id: input.folder_id }
              : {}),
            ...(input.sort_order !== undefined
              ? { sort_order: input.sort_order }
              : {}),
          },
          csrfToken
        );
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "links-use-library",
            fallback: "Failed to update link",
          });
          return false;
        }
        setLinks((prev) =>
          patchEntityInList(prev, id, {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(urlUpdate !== undefined ? { url: urlUpdate } : {}),
            ...(input.folder_id !== undefined
              ? { folder_id: input.folder_id }
              : {}),
            ...(input.sort_order !== undefined
              ? { sort_order: input.sort_order }
              : {}),
          })
        );
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update link";
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken, links, masterKey]
  );

  const removeLinkFn = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await deleteLink(id, csrfToken);
      if (!result.success) {
        reportE2eeActionFailure(result.error, {
          source: "links-use-library",
          fallback: "Failed to delete link",
        });
        return false;
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
      return true;
    },
    [csrfToken]
  );

  const reorderFoldersFn = useCallback(
    async (updates: FolderReorderUpdate[]): Promise<boolean> => {
      const result = await reorderFolders(updates, csrfToken);
      if (!result.success) {
        toast.error(result.error ?? "Failed to reorder folders", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }
      setFolders((prev) => {
        const updatesById = new Map(updates.map((u) => [u.id, u]));
        return [...prev]
          .map((folder) => {
            const match = updatesById.get(folder.id);
            if (!match) return folder;
            return {
              ...folder,
              sort_order: match.sort_order,
              ...(match.parent_folder_id !== undefined
                ? { parent_folder_id: match.parent_folder_id }
                : {}),
            };
          })
          .sort((a, b) => a.sort_order - b.sort_order);
      });
      return true;
    },
    [csrfToken]
  );

  const reorderLinksFn = useCallback(
    async (updates: LinkReorderUpdate[]): Promise<boolean> => {
      const result = await reorderLinks(updates, csrfToken);
      if (!result.success) {
        toast.error(result.error ?? "Failed to reorder links", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }
      setLinks((prev) => {
        const updatesById = new Map(updates.map((u) => [u.id, u]));
        return [...prev]
          .map((link) => {
            const match = updatesById.get(link.id);
            if (!match) return link;
            return {
              ...link,
              sort_order: match.sort_order,
              ...(match.folder_id !== undefined
                ? { folder_id: match.folder_id }
                : {}),
            };
          })
          .sort((a, b) => a.sort_order - b.sort_order);
      });
      return true;
    },
    [csrfToken]
  );

  const applyTreeDropFn = useCallback(
    async (action: TreeDropAction): Promise<boolean> => {
      switch (action.type) {
        case "reorder-folders":
          return reorderFoldersFn(action.updates);
        case "reorder-links":
          return reorderLinksFn(action.updates);
        case "move-folder": {
          const folder = folders.find((f) => f.id === action.folderId);
          if (!folder) {
            return false;
          }
          if (
            !canMoveFolderToParent(
              folders,
              action.folderId,
              action.targetParentId
            )
          ) {
            toast.error("Cannot move a folder into itself or a subfolder", {
              duration: TOAST_DURATIONS.ERROR,
            });
            return false;
          }
          const parentChanged =
            (folder.parent_folder_id ?? null) !== action.targetParentId;
          if (parentChanged) {
            const ok = await updateFolderFn(action.folderId, {
              name: folder.name,
              parent_folder_id: action.targetParentId,
            });
            if (!ok) {
              return false;
            }
          }
          return reorderFoldersFn(action.updates);
        }
        case "move-link": {
          const link = links.find((l) => l.id === action.linkId);
          if (!link) {
            return false;
          }
          const folderChanged =
            (link.folder_id ?? null) !== action.targetFolderId;
          if (folderChanged) {
            const ok = await updateLinkFn(action.linkId, {
              name: link.name,
              url: link.url,
              folder_id: action.targetFolderId,
            });
            if (!ok) {
              return false;
            }
          }
          return reorderLinksFn(action.updates);
        }
        default:
          return false;
      }
    },
    [
      folders,
      links,
      reorderFoldersFn,
      reorderLinksFn,
      updateFolderFn,
      updateLinkFn,
    ]
  );

  return {
    folders,
    links,
    isLoading,
    isRefreshing,
    error,
    refresh,
    createFolder: createFolderFn,
    updateFolder: updateFolderFn,
    removeFolder: removeFolderFn,
    createLink: createLinkFn,
    updateLink: updateLinkFn,
    removeLink: removeLinkFn,
    seedLinkDraft,
    removeLinkDraft,
    createLinkWithId,
    seedFolderDraft,
    removeFolderDraft,
    createFolderWithId,
    applyTreeDrop: applyTreeDropFn,
  };
}
