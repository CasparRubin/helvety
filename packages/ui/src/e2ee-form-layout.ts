/**
 * Shared Tailwind class strings for E2EE editor sheets and create dialogs.
 * Contacts, Tasks, Notes, and Links use the same vertical rhythm:
 * `gap-2` within a label+control group, `gap-6` between groups in editors,
 * `gap-4` between groups in create dialogs.
 */

/** Label-to-control spacing within one field group. */
export const E2EE_FORM_FIELD_CLASS = "grid gap-2";

/** Vertical spacing between field groups in right-hand editor sheets. */
export const E2EE_EDITOR_FORM_FIELDS_STACK_CLASS = "flex flex-col gap-6";

/** Vertical spacing between field groups in create dialogs. */
export const E2EE_CREATE_DIALOG_FIELDS_STACK_CLASS = "flex flex-col gap-4";

/** Editor sheet body padding (use when the field stack sets its own gap). */
export const E2EE_EDITOR_FORM_BODY_CLASS = "container mx-auto px-4 py-8";

/**
 * Editor sheet body when field groups are direct children of the container
 * (e.g. folder name + parent folder).
 */
export const E2EE_EDITOR_FORM_BODY_STACK_CLASS =
  "container mx-auto flex flex-col gap-6 px-4 py-8";

/** Create dialog field area (each field group should be a direct child, or use stack class). */
export const E2EE_CREATE_DIALOG_FIELDS_CLASS = "grid gap-4 py-4";
