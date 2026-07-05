"use client";

import { useCallback, useState, useTransition } from "react";

/** Panel state for a single-entity E2EE dashboard sheet. */
export type E2eeEntityPanelState =
  { mode: "closed" } | { mode: "open"; entityId: string };

/** Open-first draft: seed list, open sheet immediately, persist in background. */
export interface E2eeOpenNewDraftOptions {
  id: string;
  seedOptimistic: (id: string) => void;
  persist: (id: string) => Promise<{ id: string } | null>;
  onPersistFailure?: (id: string) => void;
}

/** Result of {@link useE2eeEntityPanel}. */
export interface UseE2eeEntityPanelResult {
  panel: E2eeEntityPanelState;
  isOpen: boolean;
  entityId: string | null;
  isOpeningDraft: boolean;
  openEntity: (id: string) => void;
  closePanel: () => void;
  /** Open-first: seeds optimistic row, opens sheet, persists in background. */
  openNewDraft: (options: E2eeOpenNewDraftOptions) => void;
}

/**
 * Shared sheet panel state for E2EE list dashboards (panel state only).
 * For `?param=` deep links, use {@link useE2eeEntityPanelWithUrl} and
 * {@link useSyncE2eeEntityPanelFromUrl} instead.
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
    setPanel((current) => {
      if (current.mode === "open" && current.entityId === id) {
        return current;
      }
      return { mode: "open", entityId: id };
    });
  }, []);

  const closePanel = useCallback(() => {
    setPanel((current) => {
      if (current.mode === "closed") {
        return current;
      }
      return { mode: "closed" };
    });
  }, []);

  const openNewDraft = useCallback((options: E2eeOpenNewDraftOptions) => {
    const { id, seedOptimistic, persist, onPersistFailure } = options;
    seedOptimistic(id);
    setPanel({ mode: "open", entityId: id });
    startOpenDraftTransition(async () => {
      const result = await persist(id);
      if (!result) {
        onPersistFailure?.(id);
        setPanel((current) => {
          if (current.mode === "open" && current.entityId === id) {
            return { mode: "closed" };
          }
          return current;
        });
      }
    });
  }, []);

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
