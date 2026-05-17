"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Right-hand sheet panel state for links and folders. */
export type LinksPanelState =
  | { mode: "closed" }
  | { mode: "open"; kind: "link" | "folder"; id: string };

/**
 * URL read/write helpers for the links detail sheet (`?link=` / `?folder=`).
 * Pair with a guarded `useEffect` on `searchParams` in the dashboard (see `links-dashboard.tsx`)
 * so back/forward and external links reopen the sheet only when URL state differs.
 */
export function useLinksPanelUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const readPanelFromUrl = useCallback((): LinksPanelState => {
    const linkId = searchParams.get("link");
    if (linkId) {
      return { mode: "open", kind: "link", id: linkId };
    }
    const folderId = searchParams.get("folder");
    if (folderId) {
      return { mode: "open", kind: "folder", id: folderId };
    }
    return { mode: "closed" };
  }, [searchParams]);

  const writePanelToUrl = useCallback(
    (panel: LinksPanelState) => {
      const params = new URLSearchParams(searchParams.toString());
      const currentLink = params.get("link");
      const currentFolder = params.get("folder");
      params.delete("link");
      params.delete("folder");

      if (panel.mode === "open") {
        if (panel.kind === "link") {
          if (currentLink === panel.id && !currentFolder) {
            return;
          }
          params.set("link", panel.id);
        } else {
          if (currentFolder === panel.id && !currentLink) {
            return;
          }
          params.set("folder", panel.id);
        }
      } else if (!currentLink && !currentFolder) {
        return;
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  return { readPanelFromUrl, writePanelToUrl };
}
