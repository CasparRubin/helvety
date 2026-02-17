"use client";

import { cn } from "@helvety/shared/utils";
import * as React from "react";

/**
 * CommandBar -- shared sticky toolbar shell used below the navbar in every app.
 * Provides the consistent outer nav, container, and flex row.
 * Each app fills in its own buttons / links as children.
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
        "bg-surface-toolbar sticky top-0 z-40 w-full border-b min-[2000px]:border-x",
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
