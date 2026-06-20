/**
 * Contact Encryption Helpers
 * Convenience functions for encrypting/decrypting Contacts client-side.
 *
 * This module ensures the server receives encrypted payloads for
 * protected fields; validate API and logging paths to keep this invariant.
 */

import {
  encryptEntityField,
  decryptEntityField,
  serializeEncryptedData,
  parseEncryptedData,
} from "@helvety/shared/crypto/encryption";

import { DEFAULT_CONTACT_CATEGORY_ID } from "@/lib/config/default-categories";

import type { Contact, ContactRow, ContactInput } from "@/lib/types";

const CONTACTS_TABLE = "contacts" as const;

// =============================================================================
// CONTACT ENCRYPTION
// =============================================================================

/**
 * Encrypt a Contact for database storage
 * Takes plaintext input and returns encrypted fields ready for the server.
 * Generates a client-side UUID and binds all ciphertext to it via AAD.
 */
export async function encryptContactInput(
  input: ContactInput,
  key: CryptoKey
): Promise<{
  id: string;
  encrypted_first_name: string;
  encrypted_last_name: string;
  encrypted_description: string | null;
  encrypted_email: string | null;
  encrypted_phone: string | null;
  encrypted_birthday: string | null;
  encrypted_notes: string | null;
  category_id: string;
}> {
  const id = crypto.randomUUID();
  const recordId = id;

  const encryptedFirstName = await encryptEntityField(input.first_name, key, {
    table: CONTACTS_TABLE,
    recordId,
    column: "encrypted_first_name",
  });
  const encryptedLastName = await encryptEntityField(input.last_name, key, {
    table: CONTACTS_TABLE,
    recordId,
    column: "encrypted_last_name",
  });

  let encryptedDescription: string | null = null;
  if (input.description) {
    encryptedDescription = serializeEncryptedData(
      await encryptEntityField(input.description, key, {
        table: CONTACTS_TABLE,
        recordId,
        column: "encrypted_description",
      })
    );
  }

  let encryptedEmail: string | null = null;
  if (input.email) {
    encryptedEmail = serializeEncryptedData(
      await encryptEntityField(input.email, key, {
        table: CONTACTS_TABLE,
        recordId,
        column: "encrypted_email",
      })
    );
  }

  let encryptedPhone: string | null = null;
  if (input.phone) {
    encryptedPhone = serializeEncryptedData(
      await encryptEntityField(input.phone, key, {
        table: CONTACTS_TABLE,
        recordId,
        column: "encrypted_phone",
      })
    );
  }

  let encryptedBirthday: string | null = null;
  if (input.birthday) {
    encryptedBirthday = serializeEncryptedData(
      await encryptEntityField(input.birthday, key, {
        table: CONTACTS_TABLE,
        recordId,
        column: "encrypted_birthday",
      })
    );
  }

  let encryptedNotes: string | null = null;
  if (input.notes) {
    encryptedNotes = serializeEncryptedData(
      await encryptEntityField(input.notes, key, {
        table: CONTACTS_TABLE,
        recordId,
        column: "encrypted_notes",
      })
    );
  }

  return {
    id,
    encrypted_first_name: serializeEncryptedData(encryptedFirstName),
    encrypted_last_name: serializeEncryptedData(encryptedLastName),
    encrypted_description: encryptedDescription,
    encrypted_email: encryptedEmail,
    encrypted_phone: encryptedPhone,
    encrypted_birthday: encryptedBirthday,
    encrypted_notes: encryptedNotes,
    category_id: input.category_id ?? DEFAULT_CONTACT_CATEGORY_ID,
  };
}

/**
 * Decrypt a Contact row from the database
 * Takes encrypted database row and returns plaintext Contact
 */
export async function decryptContactRow(
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

  let notes: string | null = null;
  if (row.encrypted_notes) {
    notes = await decryptEntityField(
      parseEncryptedData(row.encrypted_notes),
      key,
      { ...ctx, column: "encrypted_notes" }
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
    notes,
    category_id: row.category_id ?? DEFAULT_CONTACT_CATEGORY_ID,
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

/**
 * Encrypt fields for updating a Contact
 * Only encrypts provided fields (for partial updates)
 */
export async function encryptContactUpdate(
  id: string,
  update: Partial<ContactInput>,
  key: CryptoKey
): Promise<{
  encrypted_first_name?: string;
  encrypted_last_name?: string;
  encrypted_description?: string | null;
  encrypted_email?: string | null;
  encrypted_phone?: string | null;
  encrypted_birthday?: string | null;
  encrypted_notes?: string | null;
}> {
  const ctx = { table: CONTACTS_TABLE, recordId: id };
  const result: {
    encrypted_first_name?: string;
    encrypted_last_name?: string;
    encrypted_description?: string | null;
    encrypted_email?: string | null;
    encrypted_phone?: string | null;
    encrypted_birthday?: string | null;
    encrypted_notes?: string | null;
  } = {};

  if (update.first_name !== undefined) {
    result.encrypted_first_name = serializeEncryptedData(
      await encryptEntityField(update.first_name, key, {
        ...ctx,
        column: "encrypted_first_name",
      })
    );
  }

  if (update.last_name !== undefined) {
    result.encrypted_last_name = serializeEncryptedData(
      await encryptEntityField(update.last_name, key, {
        ...ctx,
        column: "encrypted_last_name",
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

  if (update.email !== undefined) {
    if (update.email === null) {
      result.encrypted_email = null;
    } else {
      result.encrypted_email = serializeEncryptedData(
        await encryptEntityField(update.email, key, {
          ...ctx,
          column: "encrypted_email",
        })
      );
    }
  }

  if (update.phone !== undefined) {
    if (update.phone === null) {
      result.encrypted_phone = null;
    } else {
      result.encrypted_phone = serializeEncryptedData(
        await encryptEntityField(update.phone, key, {
          ...ctx,
          column: "encrypted_phone",
        })
      );
    }
  }

  if (update.birthday !== undefined) {
    if (update.birthday === null) {
      result.encrypted_birthday = null;
    } else {
      result.encrypted_birthday = serializeEncryptedData(
        await encryptEntityField(update.birthday, key, {
          ...ctx,
          column: "encrypted_birthday",
        })
      );
    }
  }

  if (update.notes !== undefined) {
    if (update.notes === null) {
      result.encrypted_notes = null;
    } else {
      result.encrypted_notes = serializeEncryptedData(
        await encryptEntityField(update.notes, key, {
          ...ctx,
          column: "encrypted_notes",
        })
      );
    }
  }

  return result;
}
