/**
 * Shared Tailwind classes for full-height sheets that pin chrome and scroll body
 * content via {@link ScrollArea} or {@link CommandBarPageLayout}.
 */

/** Sheet content shell: full viewport height, no outer padding/gap, clips overflow. */
export const SHEET_SCROLLABLE_SHELL_CLASS =
  "flex h-full w-full flex-col gap-0 overflow-hidden p-0";

/** Body region below a pinned sheet header; completes the flex height chain. */
export const SHEET_SCROLLABLE_BODY_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden";
