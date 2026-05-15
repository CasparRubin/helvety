"use client";

import { cn } from "@helvety/shared/utils";
import * as React from "react";

/**
 * CommandBar - shared pinned toolbar shell used below the main app navbar on
 * surfaces that expose an action row (tasks, contacts, notes, PDF, image
 * upscaler, store). Parents must place this **outside** scroll regions (shell
 * prefix slot or {@link CommandBarPageLayout}); layout owns pinning via
 * `shrink-0`, not CSS sticky.
 */
export function CommandBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "bg-surface-toolbar z-40 w-full shrink-0 border-x border-b",
        className
      )}
    >
      <div className="container mx-auto px-4 py-2 md:py-0">
        <div className="flex items-center gap-1 md:h-12 md:gap-2">
          {children}
        </div>
      </div>
    </nav>
  );
}

/** Flex spacer that pushes subsequent items to the right end of the bar. */
export function CommandBarSpacer() {
  return <div className="flex-1" />;
}
