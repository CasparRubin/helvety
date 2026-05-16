"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { patchEntityInList } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import {
  triggerE2eeHookAuthErrorNavigation,
  triggerHardLogoutOnce,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  const applyDecrypted = useCallback(
    async (data: LinksDashboardData) => {
      if (!masterKey) {
        return;
      }
      const [decryptedFolders, decryptedLinks] = await Promise.all([
        decryptFolderRows(data.folders, masterKey),
        decryptLinkRows(data.links, masterKey),
      ]);
      setFolders(decryptedFolders);
      setLinks(decryptedLinks);
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
    const hasData = folders.length > 0 || links.length > 0;
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
          triggerE2eeHookAuthErrorNavigation(
            "links-use-library",
            result.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        const msg = result.error ?? "Failed to load library";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        return;
      }
      await applyDecrypted(result.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load library";
      if (
        triggerE2eeHookAuthErrorNavigation("links-use-library", msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [applyDecrypted, folders.length, isUnlocked, links.length, masterKey]);

  useEffect(() => {
    if (
      !initialDataConsumed &&
      options?.initialEncryptedFolders !== undefined &&
      options.initialEncryptedLinks !== undefined &&
      masterKey &&
      isUnlocked
    ) {
      setInitialDataConsumed(true);
      void applyDecrypted({
        folders: options.initialEncryptedFolders,
        links: options.initialEncryptedLinks,
      }).finally(() => {
        setIsLoading(false);
      });
      return;
    }
    void refresh();
  }, [
    applyDecrypted,
    initialDataConsumed,
    isUnlocked,
    masterKey,
    options?.initialEncryptedFolders,
    options?.initialEncryptedLinks,
    refresh,
  ]);

  const createFolderFn = useCallback(
    async (
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
          parentFolderId
        );
        const result = await createFolder(encrypted, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "links-use-library",
              result.error
            )
          ) {
            return null;
          }
          toast.error(result.error ?? "Failed to create folder", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return null;
        }
        const maxOrder = folders
          .filter((f) => (f.parent_folder_id ?? null) === parentFolderId)
          .reduce((max, f) => Math.max(max, f.sort_order), -1);
        setFolders((prev) =>
          [
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
          ].toSorted((a, b) => a.sort_order - b.sort_order)
        );
        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create folder";
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [csrfToken, folders, masterKey]
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
          if (
            triggerE2eeHookAuthErrorNavigation(
              "links-use-library",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to update folder", {
            duration: TOAST_DURATIONS.ERROR,
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
        if (
          triggerE2eeHookAuthErrorNavigation("links-use-library", result.error)
        ) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete folder", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }
      await refresh();
      return true;
    },
    [csrfToken, refresh]
  );

  const createLinkFn = useCallback(
    async (
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
        const encrypted = await encryptLinkInput(payload, masterKey, folderId);
        const result = await createLink(encrypted, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "links-use-library",
              result.error
            )
          ) {
            return null;
          }
          toast.error(result.error ?? "Failed to create link", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return null;
        }
        const maxOrder = links
          .filter((l) => (l.folder_id ?? null) === folderId)
          .reduce((max, l) => Math.max(max, l.sort_order), -1);
        setLinks((prev) =>
          [
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
          ].toSorted((a, b) => a.sort_order - b.sort_order)
        );
        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create link";
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [csrfToken, links, masterKey]
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
          if (
            triggerE2eeHookAuthErrorNavigation(
              "links-use-library",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to update link", {
            duration: TOAST_DURATIONS.ERROR,
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
        if (
          triggerE2eeHookAuthErrorNavigation("links-use-library", result.error)
        ) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete link", {
          duration: TOAST_DURATIONS.ERROR,
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
    applyTreeDrop: applyTreeDropFn,
  };
}
