/**
 * Client-side data export for Helvety Notes — fetch, decrypt, and download JSON.
 * Download plumbing is shared via `@helvety/shared/e2ee-json-export`.
 */

import { downloadEncryptedJsonExport } from "@helvety/shared/e2ee-json-export";

import { getAllNoteDataForExport } from "@/app/actions/entity-actions";
import { decryptItemRows } from "@/lib/crypto";

import type { Item } from "@/lib/types";

/** Decrypted note export payload written to the downloaded JSON file. */
interface DecryptedNoteExport {
  exportedAt: string;
  service: "Helvety Notes";
  note: "This export was decrypted client-side using your passkey. Plaintext note content is not sent to Helvety servers.";
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    categoryId: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

/** Fetches encrypted rows and decrypts them into the note export shape. */
async function buildNoteExportData(
  masterKey: CryptoKey
): Promise<DecryptedNoteExport> {
  const result = await getAllNoteDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const items: Item[] = await decryptItemRows(result.data.items, masterKey);

  return {
    exportedAt: new Date().toISOString(),
    service: "Helvety Notes",
    note: "This export was decrypted client-side using your passkey. Plaintext note content is not sent to Helvety servers.",
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      categoryId: item.category_id,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  };
}

/** Export and download decrypted note data (for `useE2eeDataExport`). */
export async function downloadNoteDataExport(
  masterKey: CryptoKey,
  options: { requireConfirmation?: boolean } = {}
): Promise<void> {
  const { requireConfirmation = true } = options;
  await downloadEncryptedJsonExport({
    masterKey,
    buildExportData: buildNoteExportData,
    filenamePrefix: "helvety-notes-export",
    entityLabel: "note",
    requireConfirmation,
  });
}
