"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  reportE2eeActionFailure,
  reportE2eeHookError,
  triggerHardLogoutOnce,
} from "../auth-navigation";
import { useCSRFToken } from "../csrf-provider";

import type { ActionResponse } from "@helvety/shared/types/entities";

/** Server action response with typed payload on success. */
type ActionDataResponse<T> =
  { success: true; data: T } | { success: false; error: string };

/** Options for {@link useEncryptedSingleItem}. */
export interface UseEncryptedSingleItemOptions<
  TEntity,
  TRow extends object,
  TInput extends object,
  TUpdatePayload extends object,
> {
  id: string;
  navigationSource: string;
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  loadFailureMessage: string;
  updateFailureMessage: string;
  deleteFailureMessage: string;
  decryptFailureMessage: string;
  deleteMissingIdMessage: string;
  initialEncryptedData?: TRow;
  initialData?: TEntity;
  fetchById: (id: string) => Promise<ActionDataResponse<TRow>>;
  decryptRow: (row: TRow, masterKey: CryptoKey) => Promise<TEntity>;
  encryptUpdate: (
    id: string,
    input: Partial<TInput>,
    masterKey: CryptoKey
  ) => Promise<object>;
  buildUpdatePayload: (
    id: string,
    encrypted: object,
    input: Partial<TInput>
  ) => TUpdatePayload;
  updateEntity: (
    payload: TUpdatePayload,
    csrfToken: string
  ) => Promise<ActionResponse>;
  deleteEntity: (id: string, csrfToken: string) => Promise<ActionResponse>;
  patchEntity: (prev: TEntity | null, input: Partial<TInput>) => TEntity | null;
}

/** Return value of {@link useEncryptedSingleItem}. */
export interface UseEncryptedSingleItemReturn<TEntity, TInput extends object> {
  item: TEntity | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (input: Partial<TInput>) => Promise<boolean>;
  remove: () => Promise<boolean>;
}

/** Manages one encrypted E2EE entity by id (fetch, decrypt, update, delete).
 *  Optional for standalone/detail routes or tooling — **not** for list-dashboard sheet editors;
 *  those use the Links pattern ({@link useEncryptedSortableItems} `update`/`remove`/`refresh` as props). */
export function useEncryptedSingleItem<
  TEntity,
  TRow extends object,
  TInput extends object,
  TUpdatePayload extends object,
>(
  options: UseEncryptedSingleItemOptions<TEntity, TRow, TInput, TUpdatePayload>
): UseEncryptedSingleItemReturn<TEntity, TInput> {
  const csrfToken = useCSRFToken();
  const [item, setItem] = useState<TEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialDataConsumedRef = useRef(false);
  const latestRefreshTokenRef = useRef(0);

  const {
    id,
    navigationSource,
    masterKey,
    isUnlocked,
    loadFailureMessage,
    updateFailureMessage,
    deleteFailureMessage,
    decryptFailureMessage,
    deleteMissingIdMessage,
    initialEncryptedData,
    initialData,
    fetchById,
    decryptRow,
    encryptUpdate,
    buildUpdatePayload,
    updateEntity,
    deleteEntity,
    patchEntity,
  } = options;

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setItem(null);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchById(id);
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          reportE2eeActionFailure(result.error, {
            source: navigationSource,
            fallback: loadFailureMessage,
            setError,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setItem(null);
        return;
      }

      const decrypted = await decryptRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setItem(decrypted);
    } catch (err) {
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      reportE2eeHookError(err, {
        source: navigationSource,
        fallback: loadFailureMessage,
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
      setItem(null);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    id,
    masterKey,
    isUnlocked,
    navigationSource,
    loadFailureMessage,
    fetchById,
    decryptRow,
  ]);

  const update = useCallback(
    async (input: Partial<TInput>): Promise<boolean> => {
      if (!masterKey || !id) {
        triggerHardLogoutOnce(window.location.href, navigationSource);
        return false;
      }

      try {
        const encrypted = await encryptUpdate(id, input, masterKey);
        const result = await updateEntity(
          buildUpdatePayload(id, encrypted, input),
          csrfToken
        );
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: navigationSource,
            fallback: updateFailureMessage,
          });
          return false;
        }

        setItem((prev) => patchEntity(prev, input));
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: navigationSource,
          fallback: updateFailureMessage,
        });
        return false;
      }
    },
    [
      id,
      masterKey,
      csrfToken,
      navigationSource,
      updateFailureMessage,
      encryptUpdate,
      buildUpdatePayload,
      updateEntity,
      patchEntity,
    ]
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) {
      toast.error(deleteMissingIdMessage, {
        duration: TOAST_DURATIONS.ERROR,
      });
      return false;
    }

    try {
      const result = await deleteEntity(id, csrfToken);
      if (!result.success) {
        reportE2eeActionFailure(result.error, {
          source: navigationSource,
          fallback: deleteFailureMessage,
        });
        return false;
      }

      setItem(null);
      return true;
    } catch (err) {
      reportE2eeHookError(err, {
        source: navigationSource,
        fallback: deleteFailureMessage,
      });
      return false;
    }
  }, [
    id,
    csrfToken,
    navigationSource,
    deleteFailureMessage,
    deleteMissingIdMessage,
    deleteEntity,
  ]);

  useEffect(() => {
    initialDataConsumedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!isUnlocked || !masterKey || !id) return;

    if (initialData !== undefined || initialEncryptedData !== undefined) {
      if (!initialDataConsumedRef.current) {
        initialDataConsumedRef.current = true;
        setIsLoading(true);
        setError(null);

        if (initialData !== undefined) {
          setItem(initialData);
          setIsLoading(false);
        } else if (initialEncryptedData !== undefined) {
          decryptRow(initialEncryptedData, masterKey)
            .then((decrypted) => setItem(decrypted))
            .catch((err) => {
              reportE2eeHookError(err, {
                source: navigationSource,
                fallback: decryptFailureMessage,
                setError,
              });
            })
            .finally(() => setIsLoading(false));
        }
      }
      return;
    }

    void refresh();
  }, [
    isUnlocked,
    masterKey,
    id,
    refresh,
    initialData,
    initialEncryptedData,
    navigationSource,
    decryptFailureMessage,
    decryptRow,
  ]);

  return {
    item,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
