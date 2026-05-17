"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

const EMPTY_LEGACY_PARAM_KEYS: string[] = [];

/** Options for {@link useSyncE2eeEntityPanelFromUrl}. */
export interface UseSyncE2eeEntityPanelFromUrlOptions {
  /** Primary query param (e.g. `note`, `item`, `contact`). */
  paramKey: string;
  /** Additional query keys read for deep links (writes use `paramKey` only). */
  legacyParamKeys?: string[];
  /** Active entity id from {@link useE2eeEntityPanelWithUrl}. */
  entityId: string | null;
  openEntity: (id: string) => void;
  closePanel: () => void;
  /** Called before closing or switching entities (e.g. draft cleanup). */
  onBeforeEntityChange?: (previousEntityId: string) => void;
}

/** Reads entity id from URL search params, including optional legacy keys. */
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
 * Syncs sheet panel state from URL query params (back/forward, deep links).
 * Only updates panel when URL state differs from current — avoids React #185 loops.
 * Pair with {@link useE2eeEntityPanelWithUrl}; mirrors Links dashboard guarded sync.
 */
export function useSyncE2eeEntityPanelFromUrl({
  paramKey,
  legacyParamKeys = EMPTY_LEGACY_PARAM_KEYS,
  entityId,
  openEntity,
  closePanel,
  onBeforeEntityChange,
}: UseSyncE2eeEntityPanelFromUrlOptions): void {
  const searchParams = useSearchParams();
  const entityIdRef = useRef(entityId);
  entityIdRef.current = entityId;
  const legacyKeysSignature = useMemo(
    () => legacyParamKeys.join("\0"),
    [legacyParamKeys]
  );

  useEffect(() => {
    const idFromUrl = readEntityIdFromUrl(
      searchParams,
      paramKey,
      legacyParamKeys
    );

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
  }, [
    searchParams,
    paramKey,
    legacyKeysSignature,
    openEntity,
    closePanel,
    onBeforeEntityChange,
  ]);
}
