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

/** Title bar selector; File/Format/Insert menus live here (not the document surface). */
const TITLE_BAR_SELECTOR = '[data-testid="title-bar"]';

/** Hides conflicting File menu entries under `root` (title bar and portaled menus in `.ep-root`). */
function hideConflictingFileMenuItems(root: Element): void {
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
 *
 * Observers are scoped so document keystrokes do not retrigger scans:
 * - title bar subtree (menus anchored in chrome)
 * - `.ep-root` direct children only (portaled overlay menus)
 */
export function useHideVendorFileMenuItems(
  rootRef: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;

    let titleBarObserver: MutationObserver | null = null;
    let overlayObserver: MutationObserver | null = null;
    let hostObserver: MutationObserver | null = null;

    const detachEpRootObservers = (): void => {
      titleBarObserver?.disconnect();
      titleBarObserver = null;
      overlayObserver?.disconnect();
      overlayObserver = null;
    };

    const attachToEpRoot = (epRoot: Element): boolean => {
      const titleBar = epRoot.querySelector(TITLE_BAR_SELECTOR);
      if (!titleBar) {
        return false;
      }

      hideConflictingFileMenuItems(epRoot);
      detachEpRootObservers();

      const rescanMenus = (): void => {
        hideConflictingFileMenuItems(epRoot);
      };

      titleBarObserver = new MutationObserver(rescanMenus);
      titleBarObserver.observe(titleBar, { childList: true, subtree: true });

      overlayObserver = new MutationObserver(rescanMenus);
      overlayObserver.observe(epRoot, { childList: true, subtree: false });

      return true;
    };

    const tryAttachFromHost = (): boolean => {
      const epRoot = host.querySelector(".ep-root");
      if (!epRoot) {
        return false;
      }
      return attachToEpRoot(epRoot);
    };

    if (tryAttachFromHost()) {
      return () => {
        detachEpRootObservers();
      };
    }

    hostObserver = new MutationObserver(() => {
      if (tryAttachFromHost()) {
        hostObserver?.disconnect();
        hostObserver = null;
      }
    });
    hostObserver.observe(host, { childList: true, subtree: false });

    return () => {
      hostObserver?.disconnect();
      detachEpRootObservers();
    };
  }, [rootRef]);
}
