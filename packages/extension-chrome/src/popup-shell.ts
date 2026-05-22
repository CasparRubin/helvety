import { cn } from "@helvety/shared/utils";

/** Fixed popup width (Power Platform Configurator canonical). */
export const POPUP_WIDTH_CLASS = "w-[320px]";

/** Outer shell padding and typography shared across Helvety extension popups. */
export const POPUP_SHELL_CLASS =
  "flex flex-col gap-2 px-3 py-3 text-sm leading-snug";

/** Scrollable tab panel with themed scrollbars (requires `popup.css`). */
export const TAB_PANEL_CLASS =
  "popup-tab-scroll min-h-40 max-h-72 w-full overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]";

/** Radio / choice row styling for settings and About appearance. */
export function popupChoiceRowClass(selected: boolean): string {
  return cn(
    "flex cursor-pointer items-start gap-2 rounded-none p-2 transition-colors",
    selected ? "bg-muted" : "hover:bg-muted/60",
  );
}

/** Icon-only tab trigger (label via `aria-label` / `sr-only`). */
export const POPUP_TAB_TRIGGER_ICON_CLASS =
  "flex flex-col items-center gap-0.5 rounded-none px-1 py-1 text-[10px] data-[state=active]:shadow-none";
