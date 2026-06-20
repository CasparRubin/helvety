import {
  encryptEntityField,
  decryptEntityField,
  serializeEncryptedData,
  parseEncryptedData,
} from "@helvety/shared/crypto/encryption";

import type { Link, LinkInput, LinkRow } from "@/lib/types";

const LINKS_TABLE = "links" as const;

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
  const recordId = id;

  const encryptedName = await encryptEntityField(input.name, key, {
    table: LINKS_TABLE,
    recordId,
    column: "encrypted_name",
  });
  const encryptedUrl = await encryptEntityField(input.url, key, {
    table: LINKS_TABLE,
    recordId,
    column: "encrypted_url",
  });

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
  const ctx = { table: LINKS_TABLE, recordId: row.id };
  const name = await decryptEntityField(
    parseEncryptedData(row.encrypted_name),
    key,
    { ...ctx, column: "encrypted_name" }
  );
  const url = await decryptEntityField(
    parseEncryptedData(row.encrypted_url),
    key,
    { ...ctx, column: "encrypted_url" }
  );

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
  const ctx = { table: LINKS_TABLE, recordId: id };
  const result: {
    encrypted_name?: string;
    encrypted_url?: string;
  } = {};

  if (update.name !== undefined) {
    result.encrypted_name = serializeEncryptedData(
      await encryptEntityField(update.name, key, {
        ...ctx,
        column: "encrypted_name",
      })
    );
  }

  if (update.url !== undefined) {
    result.encrypted_url = serializeEncryptedData(
      await encryptEntityField(update.url, key, {
        ...ctx,
        column: "encrypted_url",
      })
    );
  }

  return result;
}
