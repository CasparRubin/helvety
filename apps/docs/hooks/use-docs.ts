"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import {
  reportE2eeActionFailure,
  reportE2eeHookError,
  triggerHardLogoutOnce,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createDoc, deleteDoc, updateDoc } from "@/app/actions/doc-actions";
import {
  decryptDocListItems,
  decryptDocRow,
  encryptDocInput,
  encryptDocUpdate,
  useEncryptionContext,
} from "@/lib/crypto";
import { getDocsApiPath } from "@/lib/docs-zone-path";

import type { Doc, DocInput, DocListItem, DocRow } from "@/lib/types";

const E2EE_SOURCE = "docs-use-docs";

/** Return type for {@link useDocs}. */
interface UseDocsReturn {
  documents: DocListItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadDocument: (id: string) => Promise<Doc | null>;
  saveDocument: (
    input: DocInput,
    existingId?: string
  ) => Promise<string | null>;
  remove: (id: string) => Promise<boolean>;
}

/**
 * Vault document list and CRUD with client-side encryption.
 */
export function useDocs(enabled: boolean): UseDocsReturn {
  const csrfToken = useCSRFToken();
  const { masterKey, isUnlocked } = useEncryptionContext();
  const [documents, setDocuments] = useState<DocListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGeneration = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled || !isUnlocked || !masterKey) {
      setDocuments([]);
      return;
    }

    const generation = ++fetchGeneration.current;
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(getDocsApiPath("/api/docs"), {
        method: "GET",
        cache: "no-store",
      });
      const result = await parseActionResponse<DocRow[]>(
        response,
        "Failed to load documents"
      );

      if (generation !== fetchGeneration.current) return;

      if (!result.success) {
        if (
          reportE2eeActionFailure(result.error, {
            source: E2EE_SOURCE,
            fallback: "Failed to load documents",
          })
        ) {
          triggerHardLogoutOnce(window.location.href, E2EE_SOURCE);
          return;
        }
        setError(result.error);
        return;
      }

      const items = await decryptDocListItems(result.data, masterKey);
      if (generation !== fetchGeneration.current) return;
      setDocuments(items);
    } catch (err) {
      if (generation !== fetchGeneration.current) return;
      reportE2eeHookError(err, {
        source: E2EE_SOURCE,
        fallback: "Failed to load documents",
      });
      setError("Failed to load documents");
    } finally {
      if (generation === fetchGeneration.current) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
  }, [enabled, isUnlocked, masterKey]);

  useEffect(() => {
    if (!enabled) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    if (!isUnlocked || !masterKey) {
      setDocuments([]);
      return;
    }
    setIsLoading(true);
    void refresh();
  }, [enabled, isUnlocked, masterKey, refresh]);

  const loadDocument = useCallback(
    async (id: string): Promise<Doc | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, `${E2EE_SOURCE}-load`);
        return null;
      }

      try {
        const response = await fetch(getDocsApiPath(`/api/docs/${id}`), {
          method: "GET",
          cache: "no-store",
        });
        const result = await parseActionResponse<DocRow>(
          response,
          "Failed to load document"
        );
        if (!result.success) {
          if (
            reportE2eeActionFailure(result.error, {
              source: E2EE_SOURCE,
              fallback: "Failed to load document",
            })
          ) {
            triggerHardLogoutOnce(window.location.href, `${E2EE_SOURCE}-load`);
            return null;
          }
          toast.error(result.error, { duration: TOAST_DURATIONS.ERROR });
          return null;
        }
        return decryptDocRow(result.data, masterKey);
      } catch (err) {
        reportE2eeHookError(err, {
          source: E2EE_SOURCE,
          fallback: "Failed to load document",
        });
        toast.error("Failed to load document", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return null;
      }
    },
    [masterKey]
  );

  const saveDocument = useCallback(
    async (input: DocInput, existingId?: string): Promise<string | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, `${E2EE_SOURCE}-save`);
        return null;
      }

      try {
        if (existingId) {
          const encrypted = await encryptDocUpdate(
            existingId,
            input,
            masterKey
          );
          const result = await updateDoc(
            { id: existingId, ...encrypted },
            csrfToken
          );
          if (!result.success) {
            if (
              reportE2eeActionFailure(result.error, {
                source: E2EE_SOURCE,
                fallback: "Failed to update document",
              })
            ) {
              triggerHardLogoutOnce(
                window.location.href,
                `${E2EE_SOURCE}-save`
              );
              return null;
            }
            toast.error(result.error, { duration: TOAST_DURATIONS.ERROR });
            return null;
          }
          await refresh();
          return existingId;
        }

        const encrypted = await encryptDocInput(input, masterKey);
        const result = await createDoc(encrypted, csrfToken);
        if (!result.success) {
          if (
            reportE2eeActionFailure(result.error, {
              source: E2EE_SOURCE,
              fallback: "Failed to save document",
            })
          ) {
            triggerHardLogoutOnce(window.location.href, `${E2EE_SOURCE}-save`);
            return null;
          }
          toast.error(result.error, { duration: TOAST_DURATIONS.ERROR });
          return null;
        }
        await refresh();
        return result.data.id;
      } catch (err) {
        reportE2eeHookError(err, {
          source: E2EE_SOURCE,
          fallback: "Failed to save document",
        });
        toast.error("Failed to save document", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return null;
      }
    },
    [csrfToken, masterKey, refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await deleteDoc(id, csrfToken);
        if (!result.success) {
          if (
            reportE2eeActionFailure(result.error, {
              source: E2EE_SOURCE,
              fallback: "Failed to delete document",
            })
          ) {
            triggerHardLogoutOnce(
              window.location.href,
              `${E2EE_SOURCE}-delete`
            );
            return false;
          }
          toast.error(result.error, { duration: TOAST_DURATIONS.ERROR });
          return false;
        }
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: E2EE_SOURCE,
          fallback: "Failed to delete document",
        });
        toast.error("Failed to delete document", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }
    },
    [csrfToken]
  );

  return {
    documents,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadDocument,
    saveDocument,
    remove,
  };
}
