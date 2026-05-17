import { SheetDescription, SheetHeader, SheetTitle } from "./sheet";

import type { ComponentProps } from "react";

/** Props for {@link AccessibleSheetHeader}. */
export interface AccessibleSheetHeaderProps {
  title: string;
  /** Screen-reader description; satisfies Radix Dialog description requirement. */
  description: string;
  className?: ComponentProps<typeof SheetHeader>["className"];
}

/**
 * Sheet header with title and screen-reader-only description.
 * Use for every {@link SheetContent} so Radix Dialog does not warn about a missing Description.
 */
export function AccessibleSheetHeader({
  title,
  description,
  className,
}: AccessibleSheetHeaderProps): React.JSX.Element {
  return (
    <SheetHeader className={className}>
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription className="sr-only">{description}</SheetDescription>
    </SheetHeader>
  );
}
