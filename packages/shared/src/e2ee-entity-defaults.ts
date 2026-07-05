/**
 * Default structural IDs for E2EE entity creates (shared across web zones and extension).
 */

/** Default contact category for new contacts. */
export const DEFAULT_CONTACT_CATEGORY_ID = "personal";

/** Default note category for new notes. */
export const DEFAULT_NOTE_CATEGORY_ID = "personal";

/** Default task stage on create. */
export const DEFAULT_TASK_STAGE_ID = "default-item-backlog";

/**
 * DB/server sentinel for tasks with no user-selected label.
 * Form defaults use `null` for label_id; server actions and extension encrypt
 * coalesce to this value at write time.
 */
export const DEFAULT_TASK_LABEL_ID = "default-item-label";

/** Default task priority on create (smallint 0–3; DB default is 1 = Normal). */
export const DEFAULT_TASK_PRIORITY = 1;
