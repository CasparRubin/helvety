/**
 * Document encryption helpers for vault save (title + .docx bytes).
 */

import { base64Decode, base64Encode } from "@helvety/shared/crypto/encoding";

import {
  buildAAD,
  decrypt,
  encrypt,
  parseEncryptedData,
  serializeEncryptedData,
} from "./encryption";

import type { Doc, DocInput, DocListItem, DocRow } from "@/lib/types";

/**
 * Encrypt a document for database storage.
 */
export async function encryptDocInput(
  input: DocInput,
  key: CryptoKey
): Promise<{
  id: string;
  encrypted_title: string;
  encrypted_docx: string;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("docs", id);
  const encryptedTitle = await encrypt(input.title, key, aad);
  const docxBase64 = base64Encode(new Uint8Array(input.docxBytes));
  const encryptedDocx = await encrypt(docxBase64, key, aad);

  return {
    id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_docx: serializeEncryptedData(encryptedDocx),
  };
}

/**
 * Encrypt fields for updating a vault document.
 */
export async function encryptDocUpdate(
  id: string,
  update: Partial<DocInput>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_docx?: string;
}> {
  const aad = buildAAD("docs", id);
  const result: { encrypted_title?: string; encrypted_docx?: string } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key, aad);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.docxBytes !== undefined) {
    const docxBase64 = base64Encode(new Uint8Array(update.docxBytes));
    const encrypted = await encrypt(docxBase64, key, aad);
    result.encrypted_docx = serializeEncryptedData(encrypted);
  }

  return result;
}

/**
 * Decrypt a document row from the database.
 */
export async function decryptDocRow(row: DocRow, key: CryptoKey): Promise<Doc> {
  const aad = buildAAD("docs", row.id);
  const title = await decrypt(
    parseEncryptedData(row.encrypted_title),
    key,
    aad
  );
  const docxBase64 = await decrypt(
    parseEncryptedData(row.encrypted_docx),
    key,
    aad
  );
  const docxBytes = base64Decode(docxBase64);
  const docxBuffer = docxBytes.buffer.slice(
    docxBytes.byteOffset,
    docxBytes.byteOffset + docxBytes.byteLength
  );

  return {
    id: row.id,
    user_id: row.user_id,
    title,
    docxBytes: docxBuffer,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Decrypt title only for list display. */
async function decryptDocTitle(
  encryptedTitle: string,
  id: string,
  key: CryptoKey
): Promise<string> {
  const aad = buildAAD("docs", id);
  return decrypt(parseEncryptedData(encryptedTitle), key, aad);
}

/**
 * Decrypt multiple rows for list view (titles only).
 */
export async function decryptDocListItems(
  rows: DocRow[],
  key: CryptoKey
): Promise<DocListItem[]> {
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      title: await decryptDocTitle(row.encrypted_title, row.id, key),
      updated_at: row.updated_at,
    }))
  );
}
