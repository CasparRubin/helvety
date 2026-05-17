"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  useE2eeEntityPanel,
  type UseE2eeEntityPanelResult,
} from "./use-e2ee-entity-panel";

/** Options for {@link useE2eeEntityPanelWithUrl}. */
export interface UseE2eeEntityPanelWithUrlOptions {
  /** Additional query keys read for deep links (writes use `paramKey` only). */
  legacyParamKeys?: string[];
}

/**
 * Writes the active entity id to the URL query string (shallow replace).
 */
export function useE2eeEntityUrlSync(
  paramKey: string,
  options: UseE2eeEntityPanelWithUrlOptions = {}
) {
  const { legacyParamKeys = [] } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setEntityIdInUrl = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = readEntityIdFromUrl(
        searchParams,
        paramKey,
        legacyParamKeys
      );
      if (id) {
        if (current === id && params.get(paramKey) === id) {
          return;
        }
        for (const key of legacyParamKeys) {
          params.delete(key);
        }
        params.set(paramKey, id);
      } else if (!current) {
        return;
      } else {
        params.delete(paramKey);
        for (const key of legacyParamKeys) {
          params.delete(key);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [legacyParamKeys, paramKey, pathname, router, searchParams]
  );

  return { setEntityIdInUrl };
}

/** Reads the active entity id from the URL, including optional legacy query keys. */
function readEntityIdFromUrl(
  searchParams: ReturnType<typeof useSearchParams>,
  paramKey: string,
  legacyParamKeys: string[]
): string | null {
  const primary = searchParams.get(paramKey);
  if (primary) {
    return primary;
  }
  for (const key of legacyParamKeys) {
    const value = searchParams.get(key);
    if (value) {
      return value;
    }
  }
  return null;
}

/**
 * {@link useE2eeEntityPanel} plus shallow URL updates on open/close (`?param=`).
 * Pair with a `useEffect` on `useSearchParams` in the dashboard so back/forward
 * and cross-app deep links can open or close the sheet when the query changes.
 */
export function useE2eeEntityPanelWithUrl(
  paramKey: string,
  options: UseE2eeEntityPanelWithUrlOptions = {}
): UseE2eeEntityPanelResult {
  const { legacyParamKeys = [] } = options;
  const searchParams = useSearchParams();
  const initialEntityId = readEntityIdFromUrl(
    searchParams,
    paramKey,
    legacyParamKeys
  );
  const panel = useE2eeEntityPanel(initialEntityId);
  const { setEntityIdInUrl } = useE2eeEntityUrlSync(paramKey, options);

  const openEntity = useCallback(
    (id: string) => {
      panel.openEntity(id);
      setEntityIdInUrl(id);
    },
    [panel.openEntity, setEntityIdInUrl]
  );

  const closePanel = useCallback(() => {
    panel.closePanel();
    setEntityIdInUrl(null);
  }, [panel.closePanel, setEntityIdInUrl]);

  const openNewDraft = useCallback(
    (createFn: () => Promise<{ id: string } | null>) => {
      panel.openNewDraft(async () => {
        const result = await createFn();
        if (result) {
          setEntityIdInUrl(result.id);
        }
        return result;
      });
    },
    [panel.openNewDraft, setEntityIdInUrl]
  );

  return {
    ...panel,
    openEntity,
    closePanel,
    openNewDraft,
  };
}
