/**
 * Contact Encryption Helpers
 * Convenience functions for encrypting/decrypting Contacts,
 * CategoryConfigs, and Categories client-side.
 *
 * The server only ever sees encrypted data.
 */

import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  parseEncryptedData,
  buildAAD,
} from "./encryption";

import type {
  Contact,
  ContactRow,
  ContactInput,
  CategoryConfig,
  CategoryConfigRow,
  CategoryConfigInput,
  Category,
  CategoryRow,
  CategoryInput,
} from "@/lib/types";

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
  category_id?: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("contacts", id);
  const encryptedFirstName = await encrypt(input.first_name, key, aad);
  const encryptedLastName = await encrypt(input.last_name, key, aad);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key, aad);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  let encryptedEmail: string | null = null;
  if (input.email) {
    const encrypted = await encrypt(input.email, key, aad);
    encryptedEmail = serializeEncryptedData(encrypted);
  }

  let encryptedPhone: string | null = null;
  if (input.phone) {
    const encrypted = await encrypt(input.phone, key, aad);
    encryptedPhone = serializeEncryptedData(encrypted);
  }

  let encryptedBirthday: string | null = null;
  if (input.birthday) {
    const encrypted = await encrypt(input.birthday, key, aad);
    encryptedBirthday = serializeEncryptedData(encrypted);
  }

  let encryptedNotes: string | null = null;
  if (input.notes) {
    const encrypted = await encrypt(input.notes, key, aad);
    encryptedNotes = serializeEncryptedData(encrypted);
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
    category_id: input.category_id,
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
  const aad = buildAAD("contacts", row.id);
  const first_name = await decrypt(
    parseEncryptedData(row.encrypted_first_name),
    key,
    aad
  );
  const last_name = await decrypt(
    parseEncryptedData(row.encrypted_last_name),
    key,
    aad
  );

  let description: string | null = null;
  if (row.encrypted_description) {
    description = await decrypt(
      parseEncryptedData(row.encrypted_description),
      key,
      aad
    );
  }

  let email: string | null = null;
  if (row.encrypted_email) {
    email = await decrypt(parseEncryptedData(row.encrypted_email), key, aad);
  }

  let phone: string | null = null;
  if (row.encrypted_phone) {
    phone = await decrypt(parseEncryptedData(row.encrypted_phone), key, aad);
  }

  let birthday: string | null = null;
  if (row.encrypted_birthday) {
    birthday = await decrypt(
      parseEncryptedData(row.encrypted_birthday),
      key,
      aad
    );
  }

  let notes: string | null = null;
  if (row.encrypted_notes) {
    notes = await decrypt(parseEncryptedData(row.encrypted_notes), key, aad);
  }

  return {
    id: row.id,
    user_id: row.user_id,
    first_name,
    last_name,
    description,
    email,
    phone,
    birthday,
    notes,
    category_id: row.category_id,
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
  const aad = buildAAD("contacts", id);
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
    const encrypted = await encrypt(update.first_name, key, aad);
    result.encrypted_first_name = serializeEncryptedData(encrypted);
  }

  if (update.last_name !== undefined) {
    const encrypted = await encrypt(update.last_name, key, aad);
    result.encrypted_last_name = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key, aad);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  if (update.email !== undefined) {
    if (update.email === null) {
      result.encrypted_email = null;
    } else {
      const encrypted = await encrypt(update.email, key, aad);
      result.encrypted_email = serializeEncryptedData(encrypted);
    }
  }

  if (update.phone !== undefined) {
    if (update.phone === null) {
      result.encrypted_phone = null;
    } else {
      const encrypted = await encrypt(update.phone, key, aad);
      result.encrypted_phone = serializeEncryptedData(encrypted);
    }
  }

  if (update.birthday !== undefined) {
    if (update.birthday === null) {
      result.encrypted_birthday = null;
    } else {
      const encrypted = await encrypt(update.birthday, key, aad);
      result.encrypted_birthday = serializeEncryptedData(encrypted);
    }
  }

  if (update.notes !== undefined) {
    if (update.notes === null) {
      result.encrypted_notes = null;
    } else {
      const encrypted = await encrypt(update.notes, key, aad);
      result.encrypted_notes = serializeEncryptedData(encrypted);
    }
  }

  return result;
}

// =============================================================================
// CATEGORY CONFIG ENCRYPTION
// =============================================================================

/**
 * Encrypt a CategoryConfig for database storage
 */
export async function encryptCategoryConfigInput(
  input: CategoryConfigInput,
  key: CryptoKey
): Promise<{ id: string; encrypted_name: string }> {
  const id = crypto.randomUUID();
  const aad = buildAAD("category_configs", id);
  const encryptedName = await encrypt(input.name, key, aad);
  return {
    id,
    encrypted_name: serializeEncryptedData(encryptedName),
  };
}

/**
 * Decrypt a CategoryConfig row from the database
 */
export async function decryptCategoryConfigRow(
  row: CategoryConfigRow,
  key: CryptoKey
): Promise<CategoryConfig> {
  const aad = buildAAD("category_configs", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);

  return {
    id: row.id,
    user_id: row.user_id,
    name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Decrypt multiple CategoryConfig rows
 */
export async function decryptCategoryConfigRows(
  rows: CategoryConfigRow[],
  key: CryptoKey
): Promise<CategoryConfig[]> {
  return Promise.all(rows.map((row) => decryptCategoryConfigRow(row, key)));
}

/**
 * Encrypt fields for updating a CategoryConfig
 */
export async function encryptCategoryConfigUpdate(
  id: string,
  update: Partial<CategoryConfigInput>,
  key: CryptoKey
): Promise<{ encrypted_name?: string }> {
  const aad = buildAAD("category_configs", id);
  const result: { encrypted_name?: string } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }

  return result;
}

// =============================================================================
// CATEGORY ENCRYPTION
// =============================================================================

/**
 * Encrypt a Category for database storage
 */
export async function encryptCategoryInput(
  input: CategoryInput,
  key: CryptoKey
): Promise<{
  id: string;
  config_id: string;
  encrypted_name: string;
  color: string | null;
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("categories", id);
  const encryptedName = await encrypt(input.name, key, aad);

  return {
    id,
    config_id: input.config_id,
    encrypted_name: serializeEncryptedData(encryptedName),
    color: input.color ?? null,
    icon: input.icon ?? "circle",
    sort_order: input.sort_order ?? 0,
    default_rows_shown: input.default_rows_shown ?? 20,
  };
}

/**
 * Decrypt a Category row from the database
 */
export async function decryptCategoryRow(
  row: CategoryRow,
  key: CryptoKey
): Promise<Category> {
  const aad = buildAAD("categories", row.id);
  const name = await decrypt(parseEncryptedData(row.encrypted_name), key, aad);

  return {
    id: row.id,
    config_id: row.config_id,
    user_id: row.user_id,
    name,
    color: row.color,
    icon: row.icon,
    sort_order: row.sort_order,
    default_rows_shown: row.default_rows_shown,
    created_at: row.created_at,
  };
}

/**
 * Decrypt multiple Category rows
 */
export async function decryptCategoryRows(
  rows: CategoryRow[],
  key: CryptoKey
): Promise<Category[]> {
  return Promise.all(rows.map((row) => decryptCategoryRow(row, key)));
}

/**
 * Encrypt fields for updating a Category
 */
export async function encryptCategoryUpdate(
  id: string,
  update: Partial<Omit<CategoryInput, "config_id">>,
  key: CryptoKey
): Promise<{
  encrypted_name?: string;
  color?: string | null;
  icon?: string;
  sort_order?: number;
  default_rows_shown?: number;
}> {
  const aad = buildAAD("categories", id);
  const result: {
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
    default_rows_shown?: number;
  } = {};

  if (update.name !== undefined) {
    const encrypted = await encrypt(update.name, key, aad);
    result.encrypted_name = serializeEncryptedData(encrypted);
  }

  if (update.color !== undefined) {
    result.color = update.color;
  }

  if (update.icon !== undefined) {
    result.icon = update.icon;
  }

  if (update.sort_order !== undefined) {
    result.sort_order = update.sort_order;
  }

  if (update.default_rows_shown !== undefined) {
    result.default_rows_shown = update.default_rows_shown;
  }

  return result;
}
