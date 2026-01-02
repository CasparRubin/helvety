"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"

interface ActionButton {
  icon: React.ReactNode
  onClick: () => void
  ariaLabel: string
  title?: string
  description?: string
  disabled?: boolean
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline"
  className?: string
}

interface PdfActionButtonsProps {
  actions: ActionButton[]
  showGrip?: boolean
  className?: string
}

function PdfActionButtonsComponent({ actions, showGrip = false, className }: PdfActionButtonsProps): React.JSX.Element {
  return (
    <TooltipProvider>
      <div className={cn("flex flex-col items-center gap-1.5", className)}>
        {actions.map((action, index) => {
          const displayTitle = action.title || action.ariaLabel
          const displayDescription = action.description || displayTitle
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || "secondary"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 border border-border shadow-sm transition-all",
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
                    <p className="text-xs text-muted-foreground">{displayDescription}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
        {showGrip && (
          <div className="h-6 w-6 flex items-center justify-center rounded bg-background/80 backdrop-blur-sm border border-border mt-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Memoize component to prevent unnecessary re-renders
export const PdfActionButtons = React.memo(PdfActionButtonsComponent)

