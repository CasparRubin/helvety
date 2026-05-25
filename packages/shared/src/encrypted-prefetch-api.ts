import { RATE_LIMITS } from "./rate-limit";

/** Read rate limit for encrypted dashboard list prefetch GET routes (tighter than READ). */
export const ENCRYPTED_PREFETCH_READ_RATE_LIMIT = RATE_LIMITS.PREFETCH;

/** `authenticateAndRateLimit` options for encrypted list prefetch API routes. */
export function encryptedPrefetchAuthOptions(rateLimitPrefix: string): {
  rateLimitPrefix: string;
  readRateLimitConfig: typeof RATE_LIMITS.PREFETCH;
} {
  return {
    rateLimitPrefix,
    readRateLimitConfig: ENCRYPTED_PREFETCH_READ_RATE_LIMIT,
  };
}

/** Explicit column lists for prefetch queries (no `select("*")`). */
export const ENCRYPTED_PREFETCH_COLUMNS = {
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
  docs: "id,user_id,encrypted_title,encrypted_docx,created_at,updated_at",
} as const;

/**
 * Slim contact columns for cross-app link picker lists (subset of
 * `ENCRYPTED_PREFETCH_COLUMNS.contacts`). Used by Tasks `getContacts`; Notes
 * loads the full prefetch column list for its picker.
 */
export const CONTACT_LINK_PICKER_COLUMNS =
  "id,user_id,encrypted_first_name,encrypted_last_name,encrypted_email,sort_order,created_at,updated_at";
