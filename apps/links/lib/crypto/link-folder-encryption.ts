import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  parseEncryptedData,
  buildAAD,
} from "./encryption";

import type { LinkFolder, LinkFolderInput, LinkFolderRow } from "@/lib/types";

/**
 *
 */
export async function encryptFolderInput(
  input: LinkFolderInput,
  key: CryptoKey,
  parentFolderId: string | null
): Promise<{
  id: string;
  encrypted_name: string;
  parent_folder_id: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("link_folders", id);
  const encryptedName = await encrypt(input.name, key, aad);
  return {
    id,
    encrypted_name: serializeEncryptedData(encryptedName),
    parent_folder_id: parentFolderId,
  };
}

/**
 *
 */
export async function decryptFolderRow(
  row: LinkFolderRow,
  key: CryptoKey
): Promise<LinkFolder> {
  const aad = buildAAD("link_folders", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);
  return {
    id: row.id,
    user_id: row.user_id,
    parent_folder_id: row.parent_folder_id,
    name,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 *
 */
export async function decryptFolderRows(
  rows: LinkFolderRow[],
  key: CryptoKey
): Promise<LinkFolder[]> {
  return Promise.all(rows.map((row) => decryptFolderRow(row, key)));
}

/**
 *
 */
export async function encryptFolderUpdate(
  id: string,
  update: Partial<LinkFolderInput>,
  key: CryptoKey
): Promise<{ encrypted_name?: string }> {
  const aad = buildAAD("link_folders", id);
  const result: { encrypted_name?: string } = {};
  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }
  return result;
}
