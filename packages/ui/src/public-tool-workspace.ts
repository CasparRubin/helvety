/**
 * Shared layout class strings for PDF, image-upscaler, image-editor, and OCR workspaces.
 * Pin the command bar outside scroll; use these on the flex workspace row below it.
 */

/** Flex row below the pinned command bar (desktop: sidebar + canvas). */
export const PUBLIC_TOOL_WORKSPACE_ROW_CLASS =
  "flex min-h-0 flex-1 flex-col gap-4 py-4 lg:flex-row";

/** Desktop sidebar width (PDF toolkit, image-editor layers panel). */
export const PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS = "w-80 flex-shrink-0";

/**
 * Legacy alias for {@link PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS} (`w-80` = 320px).
 * Prefer `PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS` in new code.
 */
export const PUBLIC_TOOL_SIDEBAR_WIDTH_PX_CLASS = "w-[320px] flex-shrink-0";

/** Desktop sidebar surface + padding. */
export const PUBLIC_TOOL_SIDEBAR_PANEL_CLASS =
  "bg-surface-panel border-border/50 border p-6";

/** Canvas / preview drop zone shell. */
export const PUBLIC_TOOL_CANVAS_SHELL_CLASS =
  "bg-muted/30 border-border/50 flex min-h-0 flex-1 flex-col border p-6";
