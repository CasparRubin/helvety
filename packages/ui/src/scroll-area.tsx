"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "@helvety/shared/utils";

/** Combined ScrollArea root props plus optional viewport class override. */
type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  /** Merged onto the viewport (e.g. `!overflow-visible` to defeat inline overflow clipping). */
  viewportClassName?: string;
};

/**
 * Scrollable area with custom scrollbar styling and stable gutter reservation.
 * Pass **`viewportClassName`** to override inline overflow on the viewport
 * (for example `!overflow-visible` for full-bleed content inside the scroll region).
 */
function ScrollArea({
  className,
  viewportClassName,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          "scroll-gutter-stable focus-visible:ring-ring/50 flex size-full min-h-0 flex-col rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
          /*
           * Base UI sets inline layout on the content wrapper.
           * Classes alone lose to that inline rule; need `!` so flex fill works vertically.
           */
          "[&>div]:!flex [&>div]:min-h-0 [&>div]:w-full [&>div]:flex-1 [&>div]:!flex-col",
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/** Scrollbar track and thumb for a scroll area. */
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
