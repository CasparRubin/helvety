"use client";

import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  guardE2eeMasterKey,
  reportE2eeActionFailure,
  reportE2eeHookError,
} from "./auth-navigation";
import { useCSRFToken } from "./csrf-provider";

import type { EntityLinksHookResult } from "./entity-links-panel";

/** Discriminated server-action result with payload. */
export type E2eeEntityLinkActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Mutation result without a payload (link/unlink). */
export type E2eeEntityLinkMutationResult =
  | { success: true }
  | { success: false; error: string };

/** User-facing error strings passed to `reportE2eeHookError` / `reportE2eeActionFailure`. */
type E2eeEntityLinksMessages = {
  loadLinks: string;
  loadCatalog: string;
  link: string;
  unlink: string;
};

/** When `enabled` is false, the hook skips catalog/link loads (panel closed). */
type E2eeEntityLinksHookOptions = {
  enabled?: boolean;
};

/** Eager mode: one catalog fetch; link rows joined to catalog in memory. */
type EagerEntityLinksConfig<
  TCatalog extends { id: string },
  TLinked extends { id: string; link_id: string },
  TLinkRow extends { id: string },
> = {
  fetchMode: "eager";
  source: string;
  messages: E2eeEntityLinksMessages;
  loadCatalog: () => Promise<E2eeEntityLinkActionResult<unknown>>;
  loadLinks: (
    entityId: string
  ) => Promise<E2eeEntityLinkActionResult<TLinkRow[]>>;
  decryptCatalog: (data: unknown, key: CryptoKey) => Promise<TCatalog[]>;
  joinLinked: (catalog: TCatalog[], linkRows: TLinkRow[]) => TLinked[];
  link: (
    entityId: string,
    targetId: string,
    csrfToken: string
  ) => Promise<E2eeEntityLinkMutationResult>;
  unlink: (
    linkId: string,
    csrfToken: string
  ) => Promise<E2eeEntityLinkMutationResult>;
};

/** Lazy catalog mode: decrypt linked rows and catalog payloads separately (contacts→tasks/notes). */
type LazyCatalogEntityLinksConfig<
  TCatalog extends { id: string },
  TLinked extends { id: string; link_id: string },
  TLinksPayload,
  TCatalogPayload,
> = {
  fetchMode: "lazyCatalog";
  source: string;
  messages: E2eeEntityLinksMessages;
  loadLinks: (
    entityId: string
  ) => Promise<E2eeEntityLinkActionResult<TLinksPayload>>;
  loadCatalog: () => Promise<E2eeEntityLinkActionResult<TCatalogPayload>>;
  decryptLinked: (data: TLinksPayload, key: CryptoKey) => Promise<TLinked[]>;
  decryptCatalog: (
    data: TCatalogPayload,
    key: CryptoKey
  ) => Promise<TCatalog[]>;
  link: (
    entityId: string,
    targetId: string,
    csrfToken: string
  ) => Promise<E2eeEntityLinkMutationResult>;
  unlink: (
    linkId: string,
    csrfToken: string
  ) => Promise<E2eeEntityLinkMutationResult>;
};

/** Discriminated factory config (`fetchMode`: `eager` | `lazyCatalog`). */
export type CreateE2eeEntityLinksHookConfig<
  TCatalog extends { id: string },
  TLinked extends { id: string; link_id: string },
  TLinkRow extends { id: string } = { id: string },
  TLinksPayload = unknown,
  TCatalogPayload = unknown,
> =
  | EagerEntityLinksConfig<TCatalog, TLinked, TLinkRow>
  | LazyCatalogEntityLinksConfig<
      TCatalog,
      TLinked,
      TLinksPayload,
      TCatalogPayload
    >;

/**
 *
 */
function useRequestLifecycle() {
  const mountedRef = useRef(true);
  const latestRefreshRequestRef = useRef(0);
  const latestCatalogRequestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { mountedRef, latestRefreshRequestRef, latestCatalogRequestRef };
}

/**
 * Factory for cross-app E2EE entity link hooks (tasks ↔ notes ↔ contacts).
 * Apps inject server actions and decryptors; the factory handles CSRF, guards, and errors.
 */
export function createE2eeEntityLinksHook<
  TCatalog extends { id: string },
  TLinked extends { id: string; link_id: string },
  TLinkRow extends { id: string } = { id: string },
  TLinksPayload = unknown,
  TCatalogPayload = unknown,
>(
  config: CreateE2eeEntityLinksHookConfig<
    TCatalog,
    TLinked,
    TLinkRow,
    TLinksPayload,
    TCatalogPayload
  >
): (
  entityId: string,
  options?: E2eeEntityLinksHookOptions
) => EntityLinksHookResult<TCatalog, TLinked> {
  if (config.fetchMode === "eager") {
    return function useEagerEntityLinks(
      entityId: string,
      options?: E2eeEntityLinksHookOptions
    ): EntityLinksHookResult<TCatalog, TLinked> {
      const { masterKey, isUnlocked } = useEncryptionContext();
      const csrfToken = useCSRFToken();
      const enabled = options?.enabled ?? true;

      const [allItems, setAllItems] = useState<TCatalog[]>([]);
      const [linkRows, setLinkRows] = useState<TLinkRow[]>([]);
      const [isLoading, setIsLoading] = useState(true);
      const { mountedRef, latestRefreshRequestRef } = useRequestLifecycle();

      const refresh = useCallback(async () => {
        if (!enabled || !entityId) {
          setAllItems([]);
          setLinkRows([]);
          setIsLoading(false);
          return;
        }
        if (!masterKey || !isUnlocked) {
          guardE2eeMasterKey(masterKey, isUnlocked, config.source);
          setAllItems([]);
          setLinkRows([]);
          setIsLoading(false);
          return;
        }

        const requestId = ++latestRefreshRequestRef.current;
        const routeAtStart = window.location.href;
        const requestStartedAt = Date.now();
        setIsLoading(true);

        try {
          const [catalogResult, linksResult] = await Promise.all([
            config.loadCatalog(),
            config.loadLinks(entityId),
          ]);

          if (
            !mountedRef.current ||
            requestId !== latestRefreshRequestRef.current
          ) {
            return;
          }

          if (!catalogResult.success) {
            reportE2eeActionFailure(catalogResult.error, {
              source: config.source,
              fallback: config.messages.loadCatalog,
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            });
            setAllItems([]);
            setLinkRows([]);
            return;
          }

          if (!linksResult.success) {
            reportE2eeActionFailure(linksResult.error, {
              source: config.source,
              fallback: config.messages.loadLinks,
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            });
            setAllItems([]);
            setLinkRows([]);
            return;
          }

          const catalog = await config.decryptCatalog(
            catalogResult.data,
            masterKey
          );
          if (
            !mountedRef.current ||
            requestId !== latestRefreshRequestRef.current
          ) {
            return;
          }
          setAllItems(catalog);
          setLinkRows(linksResult.data);
        } catch (err) {
          if (
            !mountedRef.current ||
            requestId !== latestRefreshRequestRef.current
          ) {
            return;
          }
          reportE2eeHookError(err, {
            source: config.source,
            fallback: config.messages.loadLinks,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          });
          setAllItems([]);
          setLinkRows([]);
        } finally {
          if (
            mountedRef.current &&
            requestId === latestRefreshRequestRef.current
          ) {
            setIsLoading(false);
          }
        }
      }, [enabled, entityId, masterKey, isUnlocked]);

      useEffect(() => {
        if (enabled && isUnlocked && masterKey && entityId) {
          void refresh();
        }
      }, [enabled, isUnlocked, masterKey, entityId, refresh]);

      const linkedItems = useMemo(
        () => config.joinLinked(allItems, linkRows),
        [allItems, linkRows]
      );

      const link = useCallback(
        async (targetId: string): Promise<boolean> => {
          try {
            const result = await config.link(entityId, targetId, csrfToken);
            if (!result.success) {
              reportE2eeActionFailure(result.error, {
                source: config.source,
                fallback: config.messages.link,
              });
              return false;
            }
            await refresh();
            return true;
          } catch (err) {
            reportE2eeHookError(err, {
              source: config.source,
              fallback: config.messages.link,
            });
            return false;
          }
        },
        [entityId, csrfToken, refresh]
      );

      const unlink = useCallback(
        async (linkId: string): Promise<boolean> => {
          try {
            const result = await config.unlink(linkId, csrfToken);
            if (!result.success) {
              reportE2eeActionFailure(result.error, {
                source: config.source,
                fallback: config.messages.unlink,
              });
              return false;
            }
            setLinkRows((prev) => prev.filter((row) => row.id !== linkId));
            return true;
          } catch (err) {
            reportE2eeHookError(err, {
              source: config.source,
              fallback: config.messages.unlink,
            });
            return false;
          }
        },
        [csrfToken]
      );

      return {
        allItems,
        linkedItems,
        isLoading,
        link,
        unlink,
      };
    };
  }

  return function useLazyCatalogEntityLinks(
    entityId: string,
    options?: E2eeEntityLinksHookOptions
  ): EntityLinksHookResult<TCatalog, TLinked> {
    const { masterKey, isUnlocked } = useEncryptionContext();
    const csrfToken = useCSRFToken();
    const catalogEnabled = options?.enabled ?? false;

    const [linkedItems, setLinkedItems] = useState<TLinked[]>([]);
    const [allItems, setAllItems] = useState<TCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const catalogCacheRef = useRef<TCatalog[] | null>(null);
    const { mountedRef, latestRefreshRequestRef, latestCatalogRequestRef } =
      useRequestLifecycle();

    const refresh = useCallback(async () => {
      if (!entityId) {
        setLinkedItems([]);
        setIsLoading(false);
        return;
      }
      if (!masterKey || !isUnlocked) {
        guardE2eeMasterKey(masterKey, isUnlocked, config.source);
        setLinkedItems([]);
        setIsLoading(false);
        return;
      }

      const requestId = ++latestRefreshRequestRef.current;
      const routeAtStart = window.location.href;
      const requestStartedAt = Date.now();
      setIsLoading(true);

      try {
        const result = await config.loadLinks(entityId);
        if (
          !mountedRef.current ||
          requestId !== latestRefreshRequestRef.current
        ) {
          return;
        }
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: config.source,
            fallback: config.messages.loadLinks,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          });
          setLinkedItems([]);
          return;
        }

        const decrypted = await config.decryptLinked(result.data, masterKey);
        if (
          !mountedRef.current ||
          requestId !== latestRefreshRequestRef.current
        ) {
          return;
        }
        setLinkedItems(decrypted);
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !== latestRefreshRequestRef.current
        ) {
          return;
        }
        reportE2eeHookError(err, {
          source: config.source,
          fallback: config.messages.loadLinks,
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        });
        setLinkedItems([]);
      } finally {
        if (
          mountedRef.current &&
          requestId === latestRefreshRequestRef.current
        ) {
          setIsLoading(false);
        }
      }
    }, [entityId, masterKey, isUnlocked]);

    const loadCatalog = useCallback(async () => {
      if (catalogCacheRef.current) {
        setAllItems(catalogCacheRef.current);
        return;
      }
      if (
        !guardE2eeMasterKey(masterKey, isUnlocked, `${config.source}-catalog`)
      ) {
        return;
      }

      const requestId = ++latestCatalogRequestRef.current;
      const routeAtStart = window.location.href;
      const requestStartedAt = Date.now();
      setIsLoadingCatalog(true);

      try {
        const result = await config.loadCatalog();
        if (
          !mountedRef.current ||
          requestId !== latestCatalogRequestRef.current
        ) {
          return;
        }
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: config.source,
            fallback: config.messages.loadCatalog,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          });
          return;
        }

        const decrypted = await config.decryptCatalog(result.data, masterKey);
        if (
          !mountedRef.current ||
          requestId !== latestCatalogRequestRef.current
        ) {
          return;
        }
        catalogCacheRef.current = decrypted;
        setAllItems(decrypted);
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !== latestCatalogRequestRef.current
        ) {
          return;
        }
        reportE2eeHookError(err, {
          source: config.source,
          fallback: config.messages.loadCatalog,
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        });
      } finally {
        if (
          mountedRef.current &&
          requestId === latestCatalogRequestRef.current
        ) {
          setIsLoadingCatalog(false);
        }
      }
    }, [masterKey, isUnlocked]);

    useEffect(() => {
      if (isUnlocked && masterKey && entityId) {
        void refresh();
      }
    }, [isUnlocked, masterKey, entityId, refresh]);

    useEffect(() => {
      if (catalogEnabled && isUnlocked && masterKey) {
        void loadCatalog();
      }
    }, [catalogEnabled, isUnlocked, masterKey, loadCatalog]);

    const link = useCallback(
      async (targetId: string): Promise<boolean> => {
        try {
          const result = await config.link(entityId, targetId, csrfToken);
          if (!result.success) {
            reportE2eeActionFailure(result.error, {
              source: config.source,
              fallback: config.messages.link,
            });
            return false;
          }
          await refresh();
          return true;
        } catch (err) {
          reportE2eeHookError(err, {
            source: config.source,
            fallback: config.messages.link,
          });
          return false;
        }
      },
      [entityId, csrfToken, refresh]
    );

    const unlink = useCallback(
      async (linkId: string): Promise<boolean> => {
        try {
          const result = await config.unlink(linkId, csrfToken);
          if (!result.success) {
            reportE2eeActionFailure(result.error, {
              source: config.source,
              fallback: config.messages.unlink,
            });
            return false;
          }
          setLinkedItems((prev) =>
            prev.filter((item) => item.link_id !== linkId)
          );
          return true;
        } catch (err) {
          reportE2eeHookError(err, {
            source: config.source,
            fallback: config.messages.unlink,
          });
          return false;
        }
      },
      [csrfToken]
    );

    return {
      allItems,
      linkedItems,
      isLoading: isLoading ? true : Boolean(catalogEnabled && isLoadingCatalog),
      link,
      unlink,
    };
  };
}
