"use client";

import { useCallback, useState, useTransition } from "react";

/** Panel state for a single-entity E2EE dashboard sheet. */
export type E2eeEntityPanelState =
  { mode: "closed" } | { mode: "open"; entityId: string };

/**
 * Open-first draft: seed optimistic row and open sheet.
 * Dashboards omit `persist` (insert on first save via the list hook); pass `persist` only for optional background insert.
 */
export interface E2eeOpenNewDraftOptions {
  id: string;
  seedOptimistic: (id: string) => void;
  /** Optional background insert; omit so the list hook calls `createWithId` on first save. */
  persist?: (id: string) => Promise<{ id: string } | null>;
  /** Called when optional background `persist` fails (dashboards do not pass `persist`). */
  onPersistFailure?: (id: string) => void;
}

/** Result of {@link useE2eeEntityPanel}. */
export interface UseE2eeEntityPanelResult {
  panel: E2eeEntityPanelState;
  isOpen: boolean;
  entityId: string | null;
  /** True while optional background `persist` runs (false when dashboards omit `persist`). */
  isOpeningDraft: boolean;
  openEntity: (id: string) => void;
  closePanel: () => void;
  /** Open-first: seeds optimistic row and opens sheet; server row on first save unless `persist` is passed. */
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
    if (!persist) {
      return;
    }
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
