/** Touch-safe 16px on coarse pointer; compact 14px on mouse desktop. */
export const FORM_CONTROL_TEXT_SIZE_CLASS =
  "text-base [@media(hover:hover)_and_(pointer:fine)]:text-sm";

/** Touch-safe prose / contenteditable sizing (same breakpoints as form controls). */
export const FORM_CONTROL_PROSE_SIZE_CLASS =
  "prose prose-base dark:prose-invert [@media(hover:hover)_and_(pointer:fine)]:prose-sm max-w-none";
