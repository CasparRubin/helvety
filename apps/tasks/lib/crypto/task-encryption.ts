/**
 * Task Encryption Helpers
 * Convenience functions for encrypting and decrypting task data client-side.
 *
 * This module is the primary client path for encrypting protected fields
 * before requests are sent to the server.
 * The Tasks app consumes contact data via dedicated contact-link hooks/actions.
 */

import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  parseEncryptedData,
  buildAAD,
} from "./encryption";

import type { Item, ItemRow, ItemInput } from "@/lib/types";

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
  encrypted_start_date: string | null;
  encrypted_end_date: string | null;
  stage_id?: string | null;
  label_id?: string | null;
}> {
  const id = crypto.randomUUID();
  const aad = buildAAD("items", id);
  const encryptedTitle = await encrypt(input.title, key, aad);

  let encryptedDescription: string | null = null;
  if (input.description) {
    const encrypted = await encrypt(input.description, key, aad);
    encryptedDescription = serializeEncryptedData(encrypted);
  }

  let encryptedStartDate: string | null = null;
  if (input.start_date) {
    const encrypted = await encrypt(input.start_date, key, aad);
    encryptedStartDate = serializeEncryptedData(encrypted);
  }

  let encryptedEndDate: string | null = null;
  if (input.end_date) {
    const encrypted = await encrypt(input.end_date, key, aad);
    encryptedEndDate = serializeEncryptedData(encrypted);
  }

  return {
    id,
    encrypted_title: serializeEncryptedData(encryptedTitle),
    encrypted_description: encryptedDescription,
    encrypted_start_date: encryptedStartDate,
    encrypted_end_date: encryptedEndDate,
    stage_id: input.stage_id,
    label_id: input.label_id,
  };
}

/**
 * Decrypt an Item row from the database
 */
export async function decryptItemRow(
  row: ItemRow,
  key: CryptoKey
): Promise<Item> {
  const aad = buildAAD("items", row.id);
  const title = await decrypt(
    parseEncryptedData(row.encrypted_title),
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

  let startDate: string | null = null;
  if (row.encrypted_start_date) {
    startDate = await decrypt(
      parseEncryptedData(row.encrypted_start_date),
      key,
      aad
    );
  }

  let endDate: string | null = null;
  if (row.encrypted_end_date) {
    endDate = await decrypt(
      parseEncryptedData(row.encrypted_end_date),
      key,
      aad
    );
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    stage_id: row.stage_id,
    label_id: row.label_id,
    priority: row.priority,
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
  encrypted_start_date?: string | null;
  encrypted_end_date?: string | null;
}> {
  const aad = buildAAD("items", id);
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
    encrypted_start_date?: string | null;
    encrypted_end_date?: string | null;
  } = {};

  if (update.title !== undefined) {
    const encrypted = await encrypt(update.title, key, aad);
    result.encrypted_title = serializeEncryptedData(encrypted);
  }

  if (update.description !== undefined) {
    if (update.description === null) {
      result.encrypted_description = null;
    } else {
      const encrypted = await encrypt(update.description, key, aad);
      result.encrypted_description = serializeEncryptedData(encrypted);
    }
  }

  if (update.start_date !== undefined) {
    if (update.start_date === null) {
      result.encrypted_start_date = null;
    } else {
      const encrypted = await encrypt(update.start_date, key, aad);
      result.encrypted_start_date = serializeEncryptedData(encrypted);
    }
  }

  if (update.end_date !== undefined) {
    if (update.end_date === null) {
      result.encrypted_end_date = null;
    } else {
      const encrypted = await encrypt(update.end_date, key, aad);
      result.encrypted_end_date = serializeEncryptedData(encrypted);
    }
  }

  return result;
}
