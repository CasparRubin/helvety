"use client";

import { useCallback, useState, useTransition } from "react";

/** Panel state for a single-entity E2EE dashboard sheet. */
export type E2eeEntityPanelState =
  | { mode: "closed" }
  | { mode: "open"; entityId: string };

/** Result of {@link useE2eeEntityPanel}. */
export interface UseE2eeEntityPanelResult {
  panel: E2eeEntityPanelState;
  isOpen: boolean;
  entityId: string | null;
  isOpeningDraft: boolean;
  openEntity: (id: string) => void;
  closePanel: () => void;
  /** Persist-on-open: runs `createFn`, then opens the sheet when a row id is returned. */
  openNewDraft: (createFn: () => Promise<{ id: string } | null>) => void;
}

/**
 * Shared sheet panel state for E2EE list dashboards (panel state only).
 * For `?param=` deep links, use {@link useE2eeEntityPanelWithUrl} instead.
 * Pair with {@link E2eeEntityDetailSheet} and per-app draft snapshot cleanup on close.
 */
export function useE2eeEntityPanel(
  initialEntityId: string | null = null
): UseE2eeEntityPanelResult {
  const [panel, setPanel] = useState<E2eeEntityPanelState>(() =>
    initialEntityId
      ? { mode: "open", entityId: initialEntityId }
      : { mode: "closed" }
  );
  const [isOpeningDraft, startOpenDraftTransition] = useTransition();

  const openEntity = useCallback((id: string) => {
    setPanel({ mode: "open", entityId: id });
  }, []);

  const closePanel = useCallback(() => {
    setPanel({ mode: "closed" });
  }, []);

  const openNewDraft = useCallback(
    (createFn: () => Promise<{ id: string } | null>) => {
      startOpenDraftTransition(async () => {
        const result = await createFn();
        if (result) {
          setPanel({ mode: "open", entityId: result.id });
        }
      });
    },
    []
  );

  const isOpen = panel.mode === "open";
  const entityId = panel.mode === "open" ? panel.entityId : null;

  return {
    panel,
    isOpen,
    entityId,
    isOpeningDraft,
    openEntity,
    closePanel,
    openNewDraft,
  };
}
