"use client";

import { useEffect, type RefObject } from "react";

/** Match Eigenpal File menu labels (en); re-verify on @eigenpal/docx-editor-react bumps. */
function isVendorFileOpenItem(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized === "Open" || normalized.startsWith("Open ");
}

/** Vendor File → Save bypasses `onSave`; Helvety export uses title bar + Cmd+S. */
function isVendorFileSaveItem(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized === "Save" || normalized.startsWith("Save ");
}

/**
 * Hides Eigenpal File → Open / Save entries that conflict with Helvety-controlled
 * open (parent `documentBuffer`) and validated `onSave` export.
 */
export function useHideVendorFileMenuItems(
  rootRef: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const root = rootRef.current?.querySelector(".ep-root");
    if (!root) return;

    const hide = (): void => {
      root.querySelectorAll('[role="menuitem"]').forEach((node) => {
        const el = node as HTMLElement;
        const text = el.textContent ?? "";
        if (isVendorFileOpenItem(text) || isVendorFileSaveItem(text)) {
          el.style.display = "none";
        }
      });
    };

    hide();
    const observer = new MutationObserver(hide);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootRef]);
}
