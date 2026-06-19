"use client";

import { cn } from "@helvety/shared/utils";

import { ScrollArea } from "./scroll-area";

import type { ReactNode } from "react";

/** Props for {@link CommandBarPageLayout}. */
export interface CommandBarPageLayoutProps {
  /** Pinned toolbar rendered above the scroll region (not inside ScrollArea). */
  commandBar: ReactNode;
  /** Page body scrolled inside the shared shadcn ScrollArea. */
  children: ReactNode;
  className?: string;
  /** Extra classes on the ScrollArea root. */
  scrollAreaClassName?: string;
  /** Extra classes on the ScrollArea viewport. */
  scrollAreaViewportClassName?: string;
}

/**
 * Page shell for surfaces with an in-page command bar: pins the bar outside
 * scroll and scrolls only `children` via {@link ScrollArea}.
 */
export function CommandBarPageLayout({
  commandBar,
  children,
  className,
  scrollAreaClassName,
  scrollAreaViewportClassName,
}: CommandBarPageLayoutProps): React.JSX.Element {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="shrink-0">{commandBar}</div>
      <ScrollArea
        className={cn(
          "flex min-h-0 flex-1 flex-col [&>[data-slot=scroll-area-viewport]]:max-h-full [&>[data-slot=scroll-area-viewport]]:min-h-0 [&>[data-slot=scroll-area-viewport]]:flex-1",
          scrollAreaClassName
        )}
        viewportClassName={scrollAreaViewportClassName}
      >
        {children}
      </ScrollArea>
    </div>
  );
}
