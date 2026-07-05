import {
  encryptEntityField,
  decryptEntityField,
  serializeEncryptedData,
  parseEncryptedData,
} from "@helvety/shared/crypto/encryption";

import type { LinkFolder, LinkFolderInput, LinkFolderRow } from "@/lib/types";

const LINK_FOLDERS_TABLE = "link_folders" as const;

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
  const recordId = id;

  const encryptedName = await encryptEntityField(input.name, key, {
    table: LINK_FOLDERS_TABLE,
    recordId,
    column: "encrypted_name",
  });

  return {
    id,
    encrypted_name: serializeEncryptedData(encryptedName),
    parent_folder_id: parentFolderId,
  };
}

/**
 *
 */
async function decryptFolderRow(
  row: LinkFolderRow,
  key: CryptoKey
): Promise<LinkFolder> {
  const ctx = { table: LINK_FOLDERS_TABLE, recordId: row.id };
  const name = await decryptEntityField(
    parseEncryptedData(row.encrypted_name),
    key,
    { ...ctx, column: "encrypted_name" }
  );

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
  const ctx = { table: LINK_FOLDERS_TABLE, recordId: id };
  const result: { encrypted_name?: string } = {};

  if (update.name !== undefined) {
    result.encrypted_name = serializeEncryptedData(
      await encryptEntityField(update.name, key, {
        ...ctx,
        column: "encrypted_name",
      })
    );
  }

  return result;
}
