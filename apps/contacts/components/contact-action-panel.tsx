"use client";

/**
 * Contact Action Panel for contact properties.
 * Displays collapsible category assignment and date metadata sections.
 */

import { formatDateTime } from "@helvety/shared/dates";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Card, CardContent } from "@helvety/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@helvety/ui/collapsible";
import { renderIcon } from "@helvety/ui/icon-renderer";
import { Separator } from "@helvety/ui/separator";
import { useIsMobile } from "@helvety/ui/use-is-mobile";
import {
  CalendarIcon,
  ChevronRightIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";
import { useState } from "react";

import type { DefaultCategory } from "@/lib/config/default-categories";
import type { Contact } from "@/lib/types";

/** Props for the ContactActionPanel component. */
interface ContactActionPanelProps {
  /** The current contact being edited */
  contact: Contact;
  /** Fixed categories available for assignment */
  categories: DefaultCategory[];
  /** Persisted category assignment update callback */
  onCategoryChange: (categoryId: string) => void;
  /** Whether category update is in progress */
  isSavingCategory?: boolean;
  /** Force stacked layout styling (used by sheet-embedded editor). */
  stacked?: boolean;
}

/**
 * Renders the action panel for a contact editor.
 */
export function ContactActionPanel({
  contact,
  categories,
  onCategoryChange,
  isSavingCategory = false,
  stacked = false,
}: ContactActionPanelProps) {
  const isMobile = useIsMobile();
  const [categoryOverride, setCategoryOverride] = useState<boolean | null>(
    null
  );
  const categoryOpen = categoryOverride ?? !isMobile;

  return (
    <aside
      className={
        stacked ? "w-full" : "w-full md:sticky md:top-20 md:w-80 md:shrink-0"
      }
    >
      <Card size="sm" className="bg-surface-panel">
        <CardContent>
          {/* Category section */}
          <Collapsible open={categoryOpen} onOpenChange={setCategoryOverride}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                Category
                {isSavingCategory && (
                  <Loader2Icon className="size-3 animate-spin" />
                )}
              </h3>
              <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex flex-col gap-1">
                {categories.map((category) => {
                  const isActive = contact.category_id === category.id;
                  return (
                    <Button
                      key={category.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSavingCategory}
                      className={cn(
                        "h-auto justify-start gap-2 px-2.5 py-1.5",
                        isActive && "ring-ring/30 bg-muted ring-1"
                      )}
                      style={
                        isActive
                          ? { backgroundColor: `${category.color}18` }
                          : undefined
                      }
                      onClick={() => onCategoryChange(category.id)}
                    >
                      {renderIcon(category.icon, "size-4 shrink-0", {
                        color: category.color ?? "var(--muted-foreground)",
                      })}
                      <span
                        className={cn(
                          "truncate text-sm",
                          isActive ? "font-medium" : "font-normal"
                        )}
                      >
                        {category.name}
                      </span>
                    </Button>
                  );
                })}
                {isSavingCategory ? (
                  <div className="text-muted-foreground flex items-center gap-2 py-1 text-xs">
                    <Loader2Icon className="size-3 animate-spin" />
                    Saving category...
                  </div>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Dates section */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="group flex w-full items-center justify-between">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Dates
              </h3>
              <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {/* Created tile */}
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="bg-muted flex size-5 items-center justify-center rounded-md">
                      <CalendarIcon className="text-muted-foreground size-3" />
                    </div>
                    <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      Created
                    </span>
                  </div>
                  <p className="text-xs leading-tight font-medium">
                    {formatDateTime(contact.created_at)}
                  </p>
                </div>
                {/* Modified tile */}
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="bg-muted flex size-5 items-center justify-center rounded-md">
                      <PencilIcon className="text-muted-foreground size-3" />
                    </div>
                    <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      Modified
                    </span>
                  </div>
                  <p className="text-xs leading-tight font-medium">
                    {formatDateTime(contact.updated_at)}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </aside>
  );
}
