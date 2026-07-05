"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  reportE2eeActionFailure,
  reportE2eeHookError,
} from "./auth-navigation";

import type { ActionResponse } from "@helvety/shared/types/entities";

/** Options for {@link useE2eeDashboardSelectedEntity}. */
export interface UseE2eeDashboardSelectedEntityOptions<
  TEntity extends { id: string },
  TRow extends object,
> {
  entityId: string | null;
  entities: TEntity[];
  listIsLoading: boolean;
  listError: string | null;
  isPersistingDraft?: boolean;
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  navigationSource: string;
  loadFailureMessage: string;
  fetchById: (id: string) => Promise<ActionResponse<TRow>>;
  decryptRow: (row: TRow, masterKey: CryptoKey) => Promise<TEntity>;
}

/** Result of {@link useE2eeDashboardSelectedEntity}. */
export interface UseE2eeDashboardSelectedEntityResult<TEntity> {
  entity: TEntity | null;
  isLoadingEntity: boolean;
  entityError: string | null;
}

/**
 * Resolves the active dashboard sheet entity from the in-memory list,
 * falling back to a single-row fetch when the id is not yet in the list.
 */
export function useE2eeDashboardSelectedEntity<
  TEntity extends { id: string },
  TRow extends object,
>(
  options: UseE2eeDashboardSelectedEntityOptions<TEntity, TRow>
): UseE2eeDashboardSelectedEntityResult<TEntity> {
  const {
    entityId,
    entities,
    listIsLoading,
    listError,
    isPersistingDraft = false,
    masterKey,
    isUnlocked,
    navigationSource,
    loadFailureMessage,
    fetchById,
    decryptRow,
  } = options;

  const listMatch = entityId
    ? (entities.find((entity) => entity.id === entityId) ?? null)
    : null;

  const [fetchedEntity, setFetchedEntity] = useState<TEntity | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const latestFetchRef = useRef(0);

  const loadById = useCallback(async () => {
    if (!entityId || !masterKey || !isUnlocked) {
      setFetchedEntity(null);
      setFetchError(null);
      setIsFetching(false);
      return;
    }

    const requestId = ++latestFetchRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsFetching(true);
    setFetchError(null);

    try {
      const result = await fetchById(entityId);
      if (requestId !== latestFetchRef.current) {
        return;
      }
      if (!result.success) {
        if (
          reportE2eeActionFailure(result.error, {
            source: navigationSource,
            fallback: loadFailureMessage,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        setFetchError(result.error);
        setFetchedEntity(null);
        return;
      }
      if (!("data" in result)) {
        setFetchError(loadFailureMessage);
        setFetchedEntity(null);
        return;
      }
      const decrypted = await decryptRow(result.data, masterKey);
      if (requestId !== latestFetchRef.current) {
        return;
      }
      setFetchedEntity(decrypted);
    } catch (err) {
      if (requestId !== latestFetchRef.current) {
        return;
      }
      reportE2eeHookError(err, {
        source: navigationSource,
        fallback: loadFailureMessage,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
      setFetchError(loadFailureMessage);
      setFetchedEntity(null);
    } finally {
      if (requestId === latestFetchRef.current) {
        setIsFetching(false);
      }
    }
  }, [
    decryptRow,
    entityId,
    fetchById,
    isUnlocked,
    loadFailureMessage,
    masterKey,
    navigationSource,
  ]);

  useEffect(() => {
    if (listMatch) {
      setFetchedEntity(null);
      setFetchError(null);
      setIsFetching(false);
      return;
    }
    if (!entityId || listIsLoading) {
      return;
    }
    void loadById();
  }, [entityId, listIsLoading, listMatch, loadById]);

  const entity = listMatch ?? fetchedEntity;
  const isLoadingEntity =
    Boolean(entityId) &&
    !entity &&
    !listError &&
    (listIsLoading || isFetching || isPersistingDraft);
  const entityError = listError ?? fetchError;

  return {
    entity,
    isLoadingEntity,
    entityError,
  };
}
