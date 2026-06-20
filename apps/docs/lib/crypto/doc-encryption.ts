/**
 * Document encryption helpers for vault save (title + .docx bytes).
 */

import { base64Decode, base64Encode } from "@helvety/shared/crypto/encoding";
import {
  encryptEntityField,
  decryptEntityField,
  parseEncryptedData,
  serializeEncryptedData,
} from "@helvety/shared/crypto/encryption";

import type { Doc, DocInput, DocListItem, DocRow } from "@/lib/types";

const DOCS_TABLE = "docs" as const;

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
  const recordId = id;

  const encryptedTitle = await encryptEntityField(input.title, key, {
    table: DOCS_TABLE,
    recordId,
    column: "encrypted_title",
  });
  const docxBase64 = base64Encode(new Uint8Array(input.docxBytes));
  const encryptedDocx = await encryptEntityField(docxBase64, key, {
    table: DOCS_TABLE,
    recordId,
    column: "encrypted_docx",
  });

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
  const ctx = { table: DOCS_TABLE, recordId: id };
  const result: { encrypted_title?: string; encrypted_docx?: string } = {};

  if (update.title !== undefined) {
    result.encrypted_title = serializeEncryptedData(
      await encryptEntityField(update.title, key, {
        ...ctx,
        column: "encrypted_title",
      })
    );
  }

  if (update.docxBytes !== undefined) {
    const docxBase64 = base64Encode(new Uint8Array(update.docxBytes));
    result.encrypted_docx = serializeEncryptedData(
      await encryptEntityField(docxBase64, key, {
        ...ctx,
        column: "encrypted_docx",
      })
    );
  }

  return result;
}

/**
 * Decrypt a document row from the database.
 */
export async function decryptDocRow(row: DocRow, key: CryptoKey): Promise<Doc> {
  const ctx = { table: DOCS_TABLE, recordId: row.id };
  const title = await decryptEntityField(
    parseEncryptedData(row.encrypted_title),
    key,
    { ...ctx, column: "encrypted_title" }
  );
  const docxBase64 = await decryptEntityField(
    parseEncryptedData(row.encrypted_docx),
    key,
    { ...ctx, column: "encrypted_docx" }
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
  return decryptEntityField(parseEncryptedData(encryptedTitle), key, {
    table: DOCS_TABLE,
    recordId: id,
    column: "encrypted_title",
  });
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
