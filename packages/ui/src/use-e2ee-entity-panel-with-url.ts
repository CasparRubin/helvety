"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  useE2eeEntityPanel,
  type UseE2eeEntityPanelResult,
} from "./use-e2ee-entity-panel";

/**
 * Writes the active entity id to the URL query string (shallow replace).
 */
export function useE2eeEntityUrlSync(paramKey: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setEntityIdInUrl = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = searchParams.get(paramKey);
      if (id) {
        if (current === id && params.get(paramKey) === id) {
          return;
        }
        params.set(paramKey, id);
      } else if (!current) {
        return;
      } else {
        params.delete(paramKey);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [paramKey, pathname, router, searchParams]
  );

  return { setEntityIdInUrl };
}

/**
 * {@link useE2eeEntityPanel} plus shallow URL updates on open/close (`?param=`).
 * Pair with {@link useSyncE2eeEntityPanelFromUrl} in the dashboard so back/forward
 * and cross-app deep links open or close the sheet when the query changes.
 * Wrap the dashboard page in `<Suspense>` (required for `useSearchParams`).
 */
export function useE2eeEntityPanelWithUrl(
  paramKey: string
): UseE2eeEntityPanelResult {
  const searchParams = useSearchParams();
  const initialEntityId = searchParams.get(paramKey);
  const panel = useE2eeEntityPanel(initialEntityId);
  const { setEntityIdInUrl } = useE2eeEntityUrlSync(paramKey);

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
