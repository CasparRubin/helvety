/**
 * Note Encryption Helpers
 * Convenience functions for encrypting/decrypting notes and related contact data
 * client-side.
 *
 * This module is the primary client path for encrypting protected fields
 * before requests are sent to the server.
 * Note: Contact decryption is read-only - contacts are created and edited
 * in the Contacts app. Name, description, email, phone, and birthday are
 * decrypted here; notes content is not decrypted, only a `has_notes` flag
 * is derived.
 */

import {
  encryptEntityField,
  decryptEntityField,
  serializeEncryptedData,
  parseEncryptedData,
} from "@helvety/shared/crypto/encryption";

import { DEFAULT_NOTE_CATEGORY_ID } from "@/lib/config/default-note-categories";

import type {
  Item,
  ItemRow,
  ItemInput,
  Contact,
  ContactRow,
} from "@/lib/types";

const NOTES_TABLE = "notes" as const;
const CONTACTS_TABLE = "contacts" as const;

// =============================================================================
// ITEM ENCRYPTION
// =============================================================================

/**
 * Encrypt an Item for database storage
 */
export async function encryptItemInput(
  input: ItemInput,
  key: CryptoKey
): Promise<{
  id: string;
  encrypted_title: string;
  encrypted_description: string | null;
}> {
  const id = crypto.randomUUID();
  const recordId = id;

  const encryptedTitle = await encryptEntityField(input.title, key, {
    table: NOTES_TABLE,
    recordId,
    column: "encrypted_title",
  });

  let encryptedDescription: string | null = null;
  if (input.description) {
    encryptedDescription = serializeEncryptedData(
      await encryptEntityField(input.description, key, {
        table: NOTES_TABLE,
        recordId,
        column: "encrypted_description",
      })
    );
  }

  return {
    id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_description: encryptedDescription,
  };
}

/**
 * Decrypt an Item row from the database
 */
export async function decryptItemRow(
  row: ItemRow,
  key: CryptoKey
): Promise<Item> {
  const ctx = { table: NOTES_TABLE, recordId: row.id };
  const title = await decryptEntityField(
    parseEncryptedData(row.encrypted_title),
    key,
    { ...ctx, column: "encrypted_title" }
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decryptEntityField(
      parseEncryptedData(row.encrypted_description),
      key,
      { ...ctx, column: "encrypted_description" }
    );
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title,
    description,
    category_id: row.category_id ?? DEFAULT_NOTE_CATEGORY_ID,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple Item rows
 */
export async function decryptItemRows(
  rows: ItemRow[],
  key: CryptoKey
): Promise<Item[]> {
  return Promise.all(rows.map((row) => decryptItemRow(row, key)));
}

// =============================================================================
// UPDATE HELPERS
// =============================================================================

/**
 * Encrypt fields for updating an Item
 */
export async function encryptItemUpdate(
  id: string,
  update: Partial<ItemInput>,
  key: CryptoKey
): Promise<{
  encrypted_title?: string;
  encrypted_description?: string | null;
}> {
  const ctx = { table: NOTES_TABLE, recordId: id };
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
  } = {};

  if (update.title !== undefined) {
    result.encrypted_title = serializeEncryptedData(
      await encryptEntityField(update.title, key, {
        ...ctx,
        column: "encrypted_title",
      })
    );
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      result.encrypted_description = serializeEncryptedData(
        await encryptEntityField(update.description, key, {
          ...ctx,
          column: "encrypted_description",
        })
      );
    }
  }

  return result;
}

// =============================================================================
// CONTACT DECRYPTION (read-only, contacts are created/edited in the Contacts app)
// =============================================================================

/**
 * Decrypt a Contact row from the database.
 * Decrypts first_name, last_name, description, email, phone, and birthday.
 * Notes content is NOT decrypted; only a `has_notes` boolean flag is derived
 * from whether encrypted_notes is non-null.
 */
async function decryptContactRow(
  row: ContactRow,
  key: CryptoKey
): Promise<Contact> {
  const ctx = { table: CONTACTS_TABLE, recordId: row.id };
  const firstName = await decryptEntityField(
    parseEncryptedData(row.encrypted_first_name),
    key,
    { ...ctx, column: "encrypted_first_name" }
  );
  const lastName = await decryptEntityField(
    parseEncryptedData(row.encrypted_last_name),
    key,
    { ...ctx, column: "encrypted_last_name" }
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decryptEntityField(
      parseEncryptedData(row.encrypted_description),
      key,
      { ...ctx, column: "encrypted_description" }
    );
  }

  let email: string | null = null;
  if (row.encrypted_email) {
    email = await decryptEntityField(
      parseEncryptedData(row.encrypted_email),
      key,
      { ...ctx, column: "encrypted_email" }
    );
  }

  let phone: string | null = null;
  if (row.encrypted_phone) {
    phone = await decryptEntityField(
      parseEncryptedData(row.encrypted_phone),
      key,
      { ...ctx, column: "encrypted_phone" }
    );
  }

  let birthday: string | null = null;
  if (row.encrypted_birthday) {
    birthday = await decryptEntityField(
      parseEncryptedData(row.encrypted_birthday),
      key,
      { ...ctx, column: "encrypted_birthday" }
    );
  }

  return {
    id: row.id,
    user_id: row.user_id,
    first_name: firstName,
    last_name: lastName,
    description,
    email,
    phone,
    birthday,
    has_notes: row.encrypted_notes !== null,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple Contact rows
 */
export async function decryptContactRows(
  rows: ContactRow[],
  key: CryptoKey
): Promise<Contact[]> {
  return Promise.all(rows.map((row) => decryptContactRow(row, key)));
}
