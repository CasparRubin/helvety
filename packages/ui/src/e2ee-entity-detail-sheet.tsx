"use client";

import { AccessibleSheetHeader } from "./accessible-sheet-header";
import { E2EE_ENTITY_SHEET_CONTENT_CLASS } from "./e2ee-form-layout";
import { Sheet, SheetContent } from "./sheet";

import type { ReactNode } from "react";

/** Props for the shared E2EE entity detail sheet shell. */
export interface E2eeEntityDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * Screen-reader description for the sheet (Radix Dialog requirement).
   * Defaults to an edit prompt derived from `title`.
   */
  description?: string;
  /** Remount editor children when switching entities. */
  entityId?: string | null;
  children: ReactNode;
}

/**
 * Right-hand detail sheet shell shared by E2EE list dashboards.
 * Editors mount inside with `embedded` and own scroll via CommandBarPageLayout.
 */
export function E2eeEntityDetailSheet({
  open,
  onOpenChange,
  title,
  description,
  entityId,
  children,
}: E2eeEntityDetailSheetProps): React.JSX.Element {
  const sheetDescription = description ?? `Edit ${title}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={E2EE_ENTITY_SHEET_CONTENT_CLASS}>
        <AccessibleSheetHeader
          className="shrink-0"
          title={title}
          description={sheetDescription}
        />
        <div key={entityId ?? "closed"} className="min-h-0 flex-1">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
