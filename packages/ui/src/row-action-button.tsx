"use client";

import { cn } from "@helvety/shared/utils";

import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

import type { ComponentProps, ReactNode } from "react";

/** Props for icon row actions in lists and extension chrome. */
export interface RowActionButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "onClick" | "children"
> {
  label: string;
  tooltip?: ReactNode;
  /** Extension popup: tooltip on hover. Web lists: aria-label only. */
  showTooltip?: boolean;
  onClick?: ComponentProps<typeof Button>["onClick"];
  /** Row actions stop propagation by default so the row click handler does not fire. */
  stopPropagation?: boolean;
  children: ReactNode;
}

/**
 * Icon-only row action shared by web list toolbars and Chromium extension popups.
 * Use `showTooltip` in narrow extension chrome; web list rows rely on `aria-label`.
 */
export function RowActionButton({
  label,
  tooltip,
  showTooltip = false,
  stopPropagation = true,
  className,
  variant = "ghost",
  size = "icon-sm",
  type = "button",
  onClick,
  children,
  ...buttonProps
}: RowActionButtonProps): React.JSX.Element {
  const handleClick: ComponentProps<typeof Button>["onClick"] = (event) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onClick?.(event);
  };

  if (!showTooltip) {
    return (
      <Button
        type={type}
        variant={variant}
        size={size}
        className={cn("text-muted-foreground shrink-0", className)}
        aria-label={label}
        onClick={handleClick}
        {...buttonProps}
      >
        {children}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type={type}
            variant={variant}
            size={size}
            className={cn("text-muted-foreground shrink-0", className)}
            aria-label={label}
            onClick={handleClick}
            {...buttonProps}
          />
        }
      >
        {children}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}
