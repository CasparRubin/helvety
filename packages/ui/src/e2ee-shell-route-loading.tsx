import { cn } from "@helvety/shared/utils";

import { LoadingSpinner } from "./loading-spinner";

/**
 * Root loading UI for E2EE zones: full-viewport background with navbar and command-bar
 * skeletons so in-zone navigations match the pinned shell chrome.
 */
export function E2eeShellRouteLoading() {
  return (
    <div className="bg-background flex min-h-svh w-full min-w-0 flex-1 flex-col">
      <div
        className="border-border/40 flex h-14 shrink-0 items-center gap-3 border-b px-4"
        aria-hidden
      >
        <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="ml-auto flex gap-2">
          <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
          <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
        </div>
      </div>
      <div
        className="border-border/40 flex h-12 shrink-0 items-center gap-2 border-b px-4"
        aria-hidden
      >
        <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
        <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
        <div className="bg-muted ml-auto h-8 w-24 animate-pulse rounded-md" />
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col")}>
        <LoadingSpinner />
      </div>
    </div>
  );
}
