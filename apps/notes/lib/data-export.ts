/**
 * Client-side data export utility for Helvety Notes.
 *
 * Fetches all encrypted note data from the server, decrypts it client-side
 * using the user's master key, and provides a downloadable JSON export.
 *
 * Export rights and legal context are documented in the product legal pages.
 *
 * IMPORTANT: Decryption happens client-side.
 * Plaintext note data is not sent to the server.
 */

import { getAllNoteDataForExport } from "@/app/actions/entity-actions";
import { decryptItemRows } from "@/lib/crypto";

import type { Item } from "@/lib/types";

/** Structure of the exported (decrypted) note data */
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

/**
 * Fetch, decrypt, and structure all note data for export.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 * @returns Structured, decrypted note data ready for download
 */
async function exportDecryptedNoteData(
  masterKey: CryptoKey
): Promise<DecryptedNoteExport> {
  // 1. Fetch all encrypted note data from the server (export-specific rate limit + row cap)
  const result = await getAllNoteDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const { items: encryptedItems } = result.data;

  // 2. Decrypt all data client-side
  const items: Item[] = await decryptItemRows(encryptedItems, masterKey);

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

/**
 * Trigger a browser download of the decrypted note data as JSON.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 */
export async function downloadNoteDataExport(
  masterKey: CryptoKey
): Promise<void> {
  const data = await exportDecryptedNoteData(masterKey);

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `helvety-notes-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
