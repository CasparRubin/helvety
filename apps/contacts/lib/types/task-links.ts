/**
 * Item link types for cross-app integration with the Tasks app.
 */

/** Raw item-contact link row. */
export interface ItemContactLinkRow {
  id: string;
  item_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

/** Linked item row (encrypted title from the `items` table) */
export interface LinkedItemRow {
  id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

/** Linked item data returned by server action (encrypted title). */
export interface TaskLinkData {
  items: LinkedItemRow[];
}

/** Decrypted linked item for display. */
export interface LinkedItem {
  id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

/** Encrypted item row for picker. */
export interface PickerItemRow {
  id: string;
  encrypted_title: string;
}

/** Picker data returned by server action (encrypted title). */
export interface TaskEntitiesData {
  items: PickerItemRow[];
}

/** Decrypted item for picker. */
export interface PickerItem {
  id: string;
  title: string;
}
