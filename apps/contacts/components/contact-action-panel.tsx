"use client";

/**
 * Contact Action Panel - sidebar panel for contact properties.
 * Displays date metadata and category selection in collapsible sections.
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
import { Separator } from "@helvety/ui/separator";
import {
  CalendarIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

import { useIsMobile } from "@/hooks";
import { renderCategoryIcon } from "@/lib/icons";

import type { Contact, Category } from "@/lib/types";

/** Props for the ContactActionPanel component. */
interface ContactActionPanelProps {
  /** The current contact being edited */
  contact: Contact;
  /** Available categories for this contact */
  categories: Category[];
  /** Whether categories are still loading */
  isLoadingCategories: boolean;
  /** Callback when the user selects a different category */
  onCategoryChange: (categoryId: string | null) => void;
  /** Whether a category change is currently being saved */
  isSavingCategory?: boolean;
}

/**
 * Renders the action panel for a contact editor.
 */
export function ContactActionPanel({
  contact,
  categories,
  isLoadingCategories,
  onCategoryChange,
  isSavingCategory,
}: ContactActionPanelProps) {
  const isMobile = useIsMobile();

  // User-initiated override for collapse state. When null, derive from screen size.
  // Sections open by default on desktop, collapsed on mobile/stacked layouts.
  // Dates always stays open via defaultOpen (uncontrolled).
  const [categoryOverride, setCategoryOverride] = useState<boolean | null>(
    null
  );
  const categoryOpen = categoryOverride ?? !isMobile;

  const handleCategoryClick = useCallback(
    (categoryId: string | null) => {
      if (contact.category_id === categoryId) return;
      onCategoryChange(categoryId);
    },
    [contact.category_id, onCategoryChange]
  );

  return (
    <aside className="w-full md:sticky md:top-20 md:w-80 md:shrink-0">
      <Card size="sm" className="bg-surface-panel">
        <CardContent>
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

          <Separator className="my-4" />

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
              {isLoadingCategories ? (
                <div className="mt-2 flex items-center gap-2 py-2">
                  <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading categories...
                  </span>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-1">
                  {/* Category buttons */}
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
                          isActive && category.color
                            ? { backgroundColor: `${category.color}18` }
                            : undefined
                        }
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        {/* Category icon */}
                        {renderCategoryIcon(category.icon, "size-4 shrink-0", {
                          color: category.color ?? "var(--muted-foreground)",
                        })}
                        {/* Color dot */}
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              category.color ?? "var(--muted-foreground)",
                          }}
                        />
                        {/* Category name */}
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

                  {/* Uncategorized option */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSavingCategory}
                    className={cn(
                      "h-auto justify-start gap-2 px-2.5 py-1.5",
                      contact.category_id === null &&
                        "ring-ring/30 bg-muted ring-1"
                    )}
                    onClick={() => handleCategoryClick(null)}
                  >
                    <CircleHelpIcon className="text-muted-foreground size-4 shrink-0" />
                    <span className="bg-muted-foreground/40 size-2 shrink-0 rounded-full" />
                    <span
                      className={cn(
                        "text-muted-foreground truncate text-sm",
                        contact.category_id === null
                          ? "font-medium"
                          : "font-normal"
                      )}
                    >
                      Uncategorized
                    </span>
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </aside>
  );
}
