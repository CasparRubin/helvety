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

/**
 *
 */
export interface LinkFolderInput {
  name: string;
  parent_folder_id?: string | null;
}

/**
 *
 */
export interface LinkInput {
  name: string;
  url: string;
  folder_id?: string | null;
}

/**
 *
 */
export interface FolderReorderUpdate {
  id: string;
  sort_order: number;
  parent_folder_id?: string | null;
}

/**
 *
 */
export interface LinkReorderUpdate {
  id: string;
  sort_order: number;
  folder_id?: string | null;
}

/**
 *
 */
export interface EncryptedLinksExport {
  folders: LinkFolderRow[];
  links: LinkRow[];
}

/**
 *
 */
export interface LinksDashboardData {
  folders: LinkFolderRow[];
  links: LinkRow[];
}
