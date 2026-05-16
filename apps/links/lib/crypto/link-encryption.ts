import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  parseEncryptedData,
  buildAAD,
} from "./encryption";

import type { Link, LinkInput, LinkRow } from "@/lib/types";

/**
 *
 */
export async function encryptLinkInput(
  input: LinkInput,
  key: CryptoKey,
  folderId: string | null
): Promise<{
  id: string;
  encrypted_name: string;
  encrypted_url: string;
  folder_id: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("links", id);
  const encryptedName = await encrypt(input.name, key, aad);
  const encryptedUrl = await encrypt(input.url, key, aad);
  return {
    id,
    encrypted_name: serializeEncryptedData(encryptedName),
    encrypted_url: serializeEncryptedData(encryptedUrl),
    folder_id: folderId,
  };
}

/**
 *
 */
export async function decryptLinkRow(
  row: LinkRow,
  key: CryptoKey
): Promise<Link> {
  const aad = buildAAD("links", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);
  const url = await decrypt(parseEncryptedData(row.encrypted_url), key, aad);
  return {
    id: row.id,
    user_id: row.user_id,
    folder_id: row.folder_id,
    name,
    url,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 *
 */
export async function decryptLinkRows(
  rows: LinkRow[],
  key: CryptoKey
): Promise<Link[]> {
  return Promise.all(rows.map((row) => decryptLinkRow(row, key)));
}

/**
 *
 */
export async function encryptLinkUpdate(
  id: string,
  update: Partial<LinkInput>,
  key: CryptoKey
): Promise<{
  encrypted_name?: string;
  encrypted_url?: string;
}> {
  const aad = buildAAD("links", id);
  const result: {
    encrypted_name?: string;
    encrypted_url?: string;
  } = {};
  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }
  if (update.url !== undefined) {
    const encrypted = await encrypt(update.url, key, aad);
    result.encrypted_url = serializeEncryptedData(encrypted);
  }
  return result;
}
