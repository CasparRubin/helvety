/**
 * Task Encryption Helpers
 * Convenience functions for encrypting and decrypting task data client-side.
 *
 * This module is the primary client path for encrypting protected fields
 * before requests are sent to the server.
 * The Tasks app consumes contact data via dedicated contact-link hooks/actions.
 */

import {
  encryptEntityField,
  decryptEntityField,
  serializeEncryptedData,
  parseEncryptedData,
} from "@helvety/shared/crypto/encryption";

import type { Item, ItemRow, ItemInput } from "@/lib/types";

const ITEMS_TABLE = "items" as const;

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
  const recordId = id;

  const encryptedTitle = await encryptEntityField(input.title, key, {
    table: ITEMS_TABLE,
    recordId,
    column: "encrypted_title",
  });

  let encryptedDescription: string | null = null;
  if (input.description) {
    encryptedDescription = serializeEncryptedData(
      await encryptEntityField(input.description, key, {
        table: ITEMS_TABLE,
        recordId,
        column: "encrypted_description",
      })
    );
  }

  let encryptedStartDate: string | null = null;
  if (input.start_date) {
    encryptedStartDate = serializeEncryptedData(
      await encryptEntityField(input.start_date, key, {
        table: ITEMS_TABLE,
        recordId,
        column: "encrypted_start_date",
      })
    );
  }

  let encryptedEndDate: string | null = null;
  if (input.end_date) {
    encryptedEndDate = serializeEncryptedData(
      await encryptEntityField(input.end_date, key, {
        table: ITEMS_TABLE,
        recordId,
        column: "encrypted_end_date",
      })
    );
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
  const ctx = { table: ITEMS_TABLE, recordId: row.id };
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

  let startDate: string | null = null;
  if (row.encrypted_start_date) {
    startDate = await decryptEntityField(
      parseEncryptedData(row.encrypted_start_date),
      key,
      { ...ctx, column: "encrypted_start_date" }
    );
  }

  let endDate: string | null = null;
  if (row.encrypted_end_date) {
    endDate = await decryptEntityField(
      parseEncryptedData(row.encrypted_end_date),
      key,
      { ...ctx, column: "encrypted_end_date" }
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
  const ctx = { table: ITEMS_TABLE, recordId: id };
  const result: {
    encrypted_title?: string;
    encrypted_description?: string | null;
    encrypted_start_date?: string | null;
    encrypted_end_date?: string | null;
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

  if (update.start_date !== undefined) {
    if (update.start_date === null) {
      result.encrypted_start_date = null;
    } else {
      result.encrypted_start_date = serializeEncryptedData(
        await encryptEntityField(update.start_date, key, {
          ...ctx,
          column: "encrypted_start_date",
        })
      );
    }
  }

  if (update.end_date !== undefined) {
    if (update.end_date === null) {
      result.encrypted_end_date = null;
    } else {
      result.encrypted_end_date = serializeEncryptedData(
        await encryptEntityField(update.end_date, key, {
          ...ctx,
          column: "encrypted_end_date",
        })
      );
    }
  }

  return result;
}
