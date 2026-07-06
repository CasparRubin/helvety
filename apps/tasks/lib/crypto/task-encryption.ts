/**
 * Task Encryption Helpers
 * Thin re-exports from @helvety/shared/crypto/e2ee-entity-crypto.
 */

import {
  decryptTaskRow,
  encryptTaskCreate,
  encryptTaskUpdate,
  type TaskDetailRow,
} from "@helvety/shared/crypto/e2ee-entity-crypto";

import type { Item, ItemInput, ItemRow } from "@/lib/types";

export async function encryptItemInput(
  input: ItemInput,
  key: CryptoKey,
  recordId?: string
): Promise<{
  id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  encrypted_start_date: string | null;
  encrypted_end_date: string | null;
}> {
  const encrypted = await encryptTaskCreate(
    {
      ...input,
      stage_id: input.stage_id ?? undefined,
      label_id: input.label_id ?? undefined,
    },
    key,
    recordId
  );
  return {
    id: encrypted.id,
    encrypted_title: encrypted.encrypted_title,
    encrypted_description: encrypted.encrypted_description,
    encrypted_start_date: encrypted.encrypted_start_date,
    encrypted_end_date: encrypted.encrypted_end_date,
  };
}

export async function decryptItemRow(
  row: ItemRow,
  key: CryptoKey
): Promise<Item> {
  return decryptTaskRow(row as TaskDetailRow, key);
}

export async function decryptItemRows(
  rows: ItemRow[],
  key: CryptoKey
): Promise<Item[]> {
  return Promise.all(rows.map((row) => decryptItemRow(row, key)));
}

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
  return encryptTaskUpdate(
    id,
    {
      ...update,
      stage_id: update.stage_id ?? undefined,
      label_id: update.label_id ?? undefined,
    },
    key
  );
}
