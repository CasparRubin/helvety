import type { Link } from "@/lib/types";

/** Opens each link URL in a new tab (best-effort; popup blockers may limit count). */
export function openLinksInNewTabs(links: readonly Link[]): void {
  for (const link of links) {
    window.open(link.url, "_blank", "noopener,noreferrer");
  }
}
