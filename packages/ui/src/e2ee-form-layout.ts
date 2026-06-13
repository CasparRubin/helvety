import { SHEET_SCROLLABLE_SHELL_CLASS } from "./sheet-scroll-layout";

/**
 * Shared Tailwind class strings for E2EE editor sheets.
 * Contacts, Tasks, Notes, and Links use the same vertical rhythm:
 * `gap-2` within a label+control group, `gap-6` between groups in editors.
 */

/** Wide right-hand entity detail sheet (Notes, Tasks, Contacts, Links). */
export const E2EE_ENTITY_SHEET_CONTENT_CLASS = `${SHEET_SCROLLABLE_SHELL_CLASS} sm:max-w-[95vw] 2xl:max-w-[1800px]`;

/** Standard unsaved-changes dialog copy for E2EE entity editors. */
export const E2EE_UNSAVED_CHANGES_DIALOG = {
  title: "Unsaved changes",
  description:
    "You have unsaved changes that will be lost. Are you sure you want to continue?",
  cancelLabel: "Cancel",
  confirmLabel: "Discard changes",
} as const;

/** Label-to-control spacing within one field group. */
export const E2EE_FORM_FIELD_CLASS = "grid gap-2";

/** Vertical spacing between field groups in right-hand editor sheets. */
export const E2EE_EDITOR_FORM_FIELDS_STACK_CLASS = "flex flex-col gap-6";

/** Editor sheet body padding (use when the field stack sets its own gap). */
export const E2EE_EDITOR_FORM_BODY_CLASS = "container mx-auto px-4 py-8";

/**
 * Editor sheet body when field groups are direct children of the container
 * (e.g. folder name + parent folder).
 */
export const E2EE_EDITOR_FORM_BODY_STACK_CLASS =
  "container mx-auto flex flex-col gap-6 px-4 py-8";
