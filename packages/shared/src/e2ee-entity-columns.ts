/**
 * Canonical Supabase `.select(...)` projections for E2EE entity tables.
 *
 * Single source of truth for web prefetch routes and the Chromium extension.
 * Entity content is only read from `encrypted_*` columns.
 */

/** Slim list rows for side-panel / lightweight list views. */
export const E2EE_LIST_COLUMNS = {
  items: "id, encrypted_title, stage_id, sort_order, created_at" as const,
  notes: "id, encrypted_title, category_id, sort_order, created_at" as const,
  contacts:
    "id, encrypted_first_name, encrypted_last_name, category_id, sort_order, created_at" as const,
  links:
    "id, encrypted_name, encrypted_url, folder_id, sort_order, created_at" as const,
  link_folders:
    "id, encrypted_name, parent_folder_id, sort_order, created_at" as const,
} as const;

/** Full edit-form rows (ciphertext + structural metadata). */
export const E2EE_DETAIL_COLUMNS = {
  items:
    "id, user_id, encrypted_title, encrypted_description, encrypted_start_date, encrypted_end_date, stage_id, label_id, priority, sort_order, created_at, updated_at" as const,
  notes:
    "id, user_id, encrypted_title, encrypted_description, category_id, sort_order, created_at, updated_at" as const,
  contacts:
    "id, user_id, encrypted_first_name, encrypted_last_name, encrypted_description, encrypted_email, encrypted_phone, encrypted_birthday, encrypted_notes, category_id, sort_order, created_at, updated_at" as const,
  links:
    "id, user_id, encrypted_name, encrypted_url, folder_id, sort_order, created_at, updated_at" as const,
  link_folders:
    "id, user_id, encrypted_name, parent_folder_id, sort_order, created_at, updated_at" as const,
} as const;

/** Dashboard/API full row prefetch (web E2EE apps). */
export const E2EE_PREFETCH_COLUMNS = {
  contacts:
    "id,user_id,encrypted_first_name,encrypted_last_name,encrypted_description,encrypted_email,encrypted_phone,encrypted_birthday,encrypted_notes,category_id,sort_order,created_at,updated_at",
  items:
    "id,user_id,encrypted_title,encrypted_description,encrypted_start_date,encrypted_end_date,label_id,stage_id,priority,sort_order,created_at,updated_at",
  notes:
    "id,user_id,encrypted_title,encrypted_description,category_id,sort_order,created_at,updated_at",
  link_folders:
    "id,user_id,parent_folder_id,encrypted_name,sort_order,created_at,updated_at",
  links:
    "id,user_id,folder_id,encrypted_name,encrypted_url,sort_order,created_at,updated_at",
} as const;

/**
 * Slim contact columns for cross-app link picker lists (subset of prefetch).
 * Used by Tasks and Notes contact-link pickers.
 */
export const CONTACT_LINK_PICKER_COLUMNS =
  "id,user_id,encrypted_first_name,encrypted_last_name,encrypted_email,sort_order,created_at,updated_at";
