/**
 * Note Encryption Helpers
 * Thin re-exports from @helvety/shared/crypto/e2ee-entity-crypto.
 *
 * Contact decryption is read-only and maps shared Contact to the Notes app's
 * Contact shape (has_notes flag, notes content not decrypted).
 */

import {
  decryptContactRow as decryptSharedContactRow,
  decryptNoteRow,
  encryptNoteCreate,
  type ContactDetailRow,
} from "@helvety/shared/crypto/e2ee-entity-crypto";

import type {
  Contact,
  ContactRow,
  Item,
  ItemInput,
  ItemRow,
} from "@/lib/types";

export async function encryptItemInput(
  input: ItemInput,
  key: CryptoKey,
  recordId?: string
): Promise<{
  id: string;
  encrypted_title: string;
  encrypted_description: string | null;
}> {
  const encrypted = await encryptNoteCreate(input, key, recordId);
  return {
    id: encrypted.id,
    encrypted_title: encrypted.encrypted_title,
    encrypted_description: encrypted.encrypted_description,
  };
}

export async function decryptItemRow(
  row: ItemRow,
  key: CryptoKey
): Promise<Item> {
  return decryptNoteRow(row, key);
}

export async function decryptItemRows(
  rows: ItemRow[],
  key: CryptoKey
): Promise<Item[]> {
  return Promise.all(rows.map((row) => decryptItemRow(row, key)));
}

export { encryptNoteUpdate as encryptItemUpdate } from "@helvety/shared/crypto/e2ee-entity-crypto";

export async function decryptContactRows(
  rows: ContactRow[],
  key: CryptoKey
): Promise<Contact[]> {
  return Promise.all(
    rows.map(async (row) => {
      const contact = await decryptSharedContactRow(
        row as ContactDetailRow,
        key
      );
      return {
        id: contact.id,
        user_id: contact.user_id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        description: contact.description,
        email: contact.email,
        phone: contact.phone,
        birthday: contact.birthday,
        has_notes: row.encrypted_notes !== null,
        sort_order: contact.sort_order,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
      };
    })
  );
}
