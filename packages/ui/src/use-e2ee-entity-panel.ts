"use client";

import { useCallback, useState } from "react";

/** Panel state for a single-entity E2EE dashboard sheet. */
export type E2eeEntityPanelState =
  { mode: "closed" } | { mode: "create" } | { mode: "edit"; entityId: string };

/** Result of {@link useE2eeEntityPanel}. */
export interface UseE2eeEntityPanelResult {
  panel: E2eeEntityPanelState;
  isOpen: boolean;
  /** `create` when opening a new unsaved form; `edit` when editing a saved entity. */
  formMode: "create" | "edit" | null;
  entityId: string | null;
  openCreate: () => void;
  openEntity: (id: string) => void;
  closePanel: () => void;
}

/**
 * Shared sheet panel state for E2EE list dashboards (panel state only).
 * For `?param=` deep links, use {@link useE2eeEntityPanelWithUrl} and
 * {@link useSyncE2eeEntityPanelFromUrl} instead.
 * Pair with {@link E2eeEntityDetailSheet}; save-first create opens without an id or URL.
 */
export function useE2eeEntityPanel(
  initialEntityId: string | null = null
): UseE2eeEntityPanelResult {
  const [panel, setPanel] = useState<E2eeEntityPanelState>(() =>
    initialEntityId
      ? { mode: "edit", entityId: initialEntityId }
      : { mode: "closed" }
  );

  const openCreate = useCallback(() => {
    setPanel({ mode: "create" });
  }, []);

  const openEntity = useCallback((id: string) => {
    setPanel((current) => {
      if (current.mode === "edit" && current.entityId === id) {
        return current;
      }
      return { mode: "edit", entityId: id };
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

  const isOpen = panel.mode === "create" || panel.mode === "edit";
  const formMode =
    panel.mode === "create" ? "create" : panel.mode === "edit" ? "edit" : null;
  const entityId = panel.mode === "edit" ? panel.entityId : null;

  return {
    panel,
    isOpen,
    formMode,
    entityId,
    openCreate,
    openEntity,
    closePanel,
  };
}
