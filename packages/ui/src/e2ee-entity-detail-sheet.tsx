"use client";

import { E2EE_ENTITY_SHEET_CONTENT_CLASS } from "./e2ee-form-layout";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

import type { ReactNode } from "react";

/** Props for the shared E2EE entity detail sheet shell. */
export interface E2eeEntityDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
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
  entityId,
  children,
}: E2eeEntityDetailSheetProps): React.JSX.Element {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={E2EE_ENTITY_SHEET_CONTENT_CLASS}>
        <SheetHeader className="shrink-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div key={entityId ?? "closed"} className="min-h-0 flex-1">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
