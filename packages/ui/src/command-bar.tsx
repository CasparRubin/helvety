"use client";

import { cn } from "@helvety/shared/utils";
import * as React from "react";

/**
 * CommandBar - shared pinned toolbar shell used below the main app navbar on
 * surfaces that expose an action row (tasks, contacts, notes, links, PDF, image
 * upscaler, store). Parents must place this **outside** scroll regions (shell
 * prefix slot or {@link CommandBarPageLayout}); layout owns pinning via
 * `shrink-0`, not CSS sticky.
 *
 * **`variant`**: `solid` (default; opaque `bg-surface-toolbar`) or `translucent`
 * (frosted `bg-surface-toolbar/65` with backdrop blur for optional full-bleed
 * backgrounds). Store section nav uses `solid` for an opaque toolbar.
 */
export function CommandBar({
  children,
  className,
  variant = "solid",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "translucent";
}) {
  return (
    <nav
      className={cn(
        "border-border z-40 w-full shrink-0 border-x border-b",
        variant === "solid" && "bg-surface-toolbar",
        variant === "translucent" &&
          "bg-surface-toolbar/65 supports-[backdrop-filter]:bg-surface-toolbar/40 backdrop-blur",
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
