"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { setE2eePanelUrlIntent } from "./e2ee-panel-url-intent";
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
          setE2eePanelUrlIntent("idle");
          return;
        }
        params.set(paramKey, id);
      } else if (!current) {
        setE2eePanelUrlIntent("idle");
        return;
      } else {
        params.delete(paramKey);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
      setE2eePanelUrlIntent("idle");
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

  const openCreate = useCallback(() => {
    panel.openCreate();
  }, [panel.openCreate]);

  const openEntity = useCallback(
    (id: string) => {
      setE2eePanelUrlIntent("opening");
      panel.openEntity(id);
      setEntityIdInUrl(id);
    },
    [panel.openEntity, setEntityIdInUrl]
  );

  const closePanel = useCallback(() => {
    setE2eePanelUrlIntent("closing");
    panel.closePanel();
    setEntityIdInUrl(null);
  }, [panel.closePanel, setEntityIdInUrl]);

  return {
    ...panel,
    openCreate,
    openEntity,
    closePanel,
  };
}
