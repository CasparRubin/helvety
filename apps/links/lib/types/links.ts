/** Encrypted folder row from `link_folders`. */
export interface LinkFolderRow {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  encrypted_name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Decrypted folder for client use. */
export interface LinkFolder {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Encrypted link row from `links`. */
export interface LinkRow {
  id: string;
  user_id: string;
  folder_id: string | null;
  encrypted_name: string;
  encrypted_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Decrypted bookmark for client use. */
export interface Link {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating or updating a folder (`null` parent = inside All). */
export interface LinkFolderInput {
  name: string;
  parent_folder_id?: string | null;
}

/** Input for creating or updating a link (`null` folder = inside All). */
export interface LinkInput {
  name: string;
  url: string;
  folder_id?: string | null;
}

/** Batch folder reorder/move payload. */
export interface FolderReorderUpdate {
  id: string;
  sort_order: number;
  parent_folder_id?: string | null;
}

/** Batch link reorder/move payload. */
export interface LinkReorderUpdate {
  id: string;
  sort_order: number;
  folder_id?: string | null;
}

/** Decrypted export bundle (encrypted rows as stored server-side). */
export interface EncryptedLinksExport {
  folders: LinkFolderRow[];
  links: LinkRow[];
}

/** Library payload returned by `/api/library`. */
export interface LinksDashboardData {
  folders: LinkFolderRow[];
  links: LinkRow[];
}
