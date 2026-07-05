"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { getE2eePanelUrlIntentRef } from "./e2ee-panel-url-intent";

/** Options for {@link useSyncE2eeEntityPanelFromUrl}. */
export interface UseSyncE2eeEntityPanelFromUrlOptions {
  /** Primary query param (e.g. `note`, `item`, `contact`). */
  paramKey: string;
  /** Active entity id from {@link useE2eeEntityPanelWithUrl} (null in create mode). */
  entityId: string | null;
  /** `create` while composing an unsaved record (no URL param). */
  formMode: "create" | "edit" | null;
  openEntity: (id: string) => void;
  closePanel: () => void;
  /** Called before closing or switching edit entities. */
  onBeforeEntityChange?: (previousEntityId: string) => void;
}

/**
 * Syncs sheet panel state from URL query params (back/forward, deep links).
 * Only updates panel when URL state differs from current — avoids React #185 loops.
 * Pair with {@link useE2eeEntityPanelWithUrl}; save-first create stays open without a URL param.
 */
export function useSyncE2eeEntityPanelFromUrl({
  paramKey,
  entityId,
  formMode,
  openEntity,
  closePanel,
  onBeforeEntityChange,
}: UseSyncE2eeEntityPanelFromUrlOptions): void {
  const searchParams = useSearchParams();
  const entityIdRef = useRef(entityId);
  entityIdRef.current = entityId;
  const formModeRef = useRef(formMode);
  formModeRef.current = formMode;

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

    if (formModeRef.current === "create") {
      return;
    }

    if (entityIdRef.current) {
      const intent = getE2eePanelUrlIntentRef().current;
      if (intent === "opening" || intent === "closing") {
        return;
      }
      onBeforeEntityChange?.(entityIdRef.current);
      closePanel();
    }
  }, [searchParams, paramKey, openEntity, closePanel, onBeforeEntityChange]);
}
