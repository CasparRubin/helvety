"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Options for {@link useSyncE2eeEntityPanelFromUrl}. */
export interface UseSyncE2eeEntityPanelFromUrlOptions {
  /** Primary query param (e.g. `note`, `item`, `contact`). */
  paramKey: string;
  /** Active entity id from {@link useE2eeEntityPanelWithUrl}. */
  entityId: string | null;
  openEntity: (id: string) => void;
  closePanel: () => void;
  /** Called before closing or switching entities (e.g. draft cleanup). */
  onBeforeEntityChange?: (previousEntityId: string) => void;
}

/**
 * Syncs sheet panel state from URL query params (back/forward, deep links).
 * Only updates panel when URL state differs from current — avoids React #185 loops.
 * Pair with {@link useE2eeEntityPanelWithUrl}; mirrors Links dashboard guarded sync.
 */
export function useSyncE2eeEntityPanelFromUrl({
  paramKey,
  entityId,
  openEntity,
  closePanel,
  onBeforeEntityChange,
}: UseSyncE2eeEntityPanelFromUrlOptions): void {
  const searchParams = useSearchParams();
  const entityIdRef = useRef(entityId);
  entityIdRef.current = entityId;

  useEffect(() => {
    const idFromUrl = searchParams.get(paramKey);

    if (idFromUrl) {
      if (entityIdRef.current !== idFromUrl) {
        if (entityIdRef.current) {
          onBeforeEntityChange?.(entityIdRef.current);
        }
        openEntity(idFromUrl);
      }
      return;
    }

    if (entityIdRef.current) {
      onBeforeEntityChange?.(entityIdRef.current);
      closePanel();
    }
  }, [searchParams, paramKey, openEntity, closePanel, onBeforeEntityChange]);
}
