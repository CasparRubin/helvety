"use client";

import { cn } from "@helvety/shared/utils";
import * as React from "react";

/**
 * CommandBar — shared sticky toolbar shell used below the main app navbar on
 * surfaces that expose a sticky action row (tasks, contacts, notes, PDF,
 * image upscaler, store). Provides the outer container and flex row; each app
 * supplies its own buttons and links as children.
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
        "bg-surface-toolbar sticky top-0 z-40 w-full border-x border-b",
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
