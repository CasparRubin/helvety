"use client";

import { useEffect, type RefObject } from "react";

/** Match Eigenpal File menu labels (en); re-verify on @eigenpal/docx-editor-react bumps. */
function isVendorFileOpenItem(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized === "Open" || normalized.startsWith("Open ");
}

/** Vendor File → Save bypasses `onSave`; Helvety export uses command bar + Cmd+S. */
function isVendorFileSaveItem(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized === "Save" || normalized.startsWith("Save ");
}

/** Vendor File → New duplicates Helvety command bar New. */
function isVendorFileNewItem(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return (
    normalized === "New" ||
    normalized.startsWith("New ") ||
    normalized === "New document" ||
    normalized.startsWith("New document ")
  );
}

/** Hides conflicting Eigenpal File menu entries inside a mounted `.ep-root`. */
function hideVendorFileMenuItems(root: Element): void {
  root.querySelectorAll('[role="menuitem"]').forEach((node) => {
    const el = node as HTMLElement;
    const text = el.textContent ?? "";
    if (
      isVendorFileOpenItem(text) ||
      isVendorFileSaveItem(text) ||
      isVendorFileNewItem(text)
    ) {
      el.style.display = "none";
    }
  });
}

/**
 * Hides Eigenpal File → Open / Save / New entries that conflict with Helvety-controlled
 * open (parent `documentBuffer`), validated `onSave` export, and command bar New.
 * Uses a `MutationObserver` so late-mounted `.ep-root` menus are covered.
 */
export function useHideVendorFileMenuItems(
  rootRef: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;

    let menuObserver: MutationObserver | null = null;

    const attachToEpRoot = (root: Element): void => {
      hideVendorFileMenuItems(root);
      menuObserver?.disconnect();
      menuObserver = new MutationObserver(() => hideVendorFileMenuItems(root));
      menuObserver.observe(root, { childList: true, subtree: true });
    };

    const existing = host.querySelector(".ep-root");
    if (existing) {
      attachToEpRoot(existing);
      return () => menuObserver?.disconnect();
    }

    const hostObserver = new MutationObserver(() => {
      const epRoot = host.querySelector(".ep-root");
      if (epRoot) {
        attachToEpRoot(epRoot);
      }
    });
    hostObserver.observe(host, { childList: true, subtree: true });

    return () => {
      hostObserver.disconnect();
      menuObserver?.disconnect();
    };
  }, [rootRef]);
}
