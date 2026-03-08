"use client";

/**
 * Contact Action Panel - sidebar panel for contact properties.
 * Displays category assignment and date metadata.
 */

import { formatDateTime } from "@helvety/shared/dates";
import { Card, CardContent } from "@helvety/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@helvety/ui/collapsible";
import {
  CalendarIcon,
  ChevronRightIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";

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
}

/**
 * Renders the action panel for a contact editor.
 */
export function ContactActionPanel({
  contact,
  categories,
  onCategoryChange,
  isSavingCategory = false,
}: ContactActionPanelProps) {
  return (
    <aside className="w-full md:sticky md:top-20 md:w-80 md:shrink-0">
      <Card size="sm" className="bg-surface-panel">
        <CardContent>
          <div className="mb-4 grid gap-2">
            <label
              htmlFor="contact-category"
              className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
            >
              Category
            </label>
            <div className="relative">
              <select
                id="contact-category"
                value={contact.category_id}
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={isSavingCategory}
                className="border-input bg-background h-10 w-full rounded-md border px-3 pr-9 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {isSavingCategory ? (
                <Loader2Icon className="text-muted-foreground absolute top-1/2 right-2 size-4 -translate-y-1/2 animate-spin" />
              ) : null}
            </div>
          </div>

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
