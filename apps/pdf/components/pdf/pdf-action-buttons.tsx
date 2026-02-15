"use client";

import { GripVertical } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Single action button config (icon, handlers, label, optional title/description). */
interface ActionButton {
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  title?: string;
  description?: string;
  disabled?: boolean;
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  className?: string;
}

/** Props for the PDF action buttons toolbar (actions list, optional grip, className). */
interface PdfActionButtonsProps {
  actions: ActionButton[];
  showGrip?: boolean;
  className?: string;
}

/** Renders a vertical toolbar of PDF action buttons with optional drag grip. */
function PdfActionButtonsComponent({
  actions,
  showGrip = false,
  className,
}: PdfActionButtonsProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      {actions.map((action) => {
        const displayTitle = action.title ?? action.ariaLabel;
        const displayDescription = action.description ?? displayTitle;

        return (
          <Tooltip key={action.ariaLabel}>
            <TooltipTrigger asChild>
              <Button
                variant={action.variant ?? "secondary"}
                size="icon"
                className={cn(
                  "border-border h-9 w-9 border shadow-sm transition-all",
                  action.variant === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground border-destructive"
                    : "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                  action.className
                )}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.ariaLabel}
              >
                {action.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{displayTitle}</p>
                {action.description && action.description !== displayTitle && (
                  <p className="text-muted-foreground text-xs">
                    {displayDescription}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
      {showGrip && (
        <div className="bg-background/80 border-border mt-1 flex h-6 w-6 cursor-grab items-center justify-center rounded border backdrop-blur-sm active:cursor-grabbing">
          <GripVertical className="text-muted-foreground h-3 w-3" />
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const PdfActionButtons = React.memo(PdfActionButtonsComponent);
