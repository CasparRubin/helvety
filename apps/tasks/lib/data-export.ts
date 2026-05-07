/**
 * Client-side data export utility for Helvety Tasks.
 *
 * Fetches all encrypted task data from the server, decrypts it client-side
 * using the user's master key, and provides a downloadable JSON export.
 *
 * Export rights and legal context are documented in the product legal pages.
 *
 * IMPORTANT: Decryption happens client-side.
 * Plaintext task data is not sent to the server.
 */

import { getAllTaskDataForExport } from "@/app/actions/entity-actions";
import { decryptItemRows } from "@/lib/crypto";

import type { Item } from "@/lib/types";

/** Structure of the exported (decrypted) task data */
interface DecryptedTaskExport {
  exportedAt: string;
  service: "Helvety Tasks";
  note: "This export was decrypted client-side using your passkey. Plaintext task content is not sent to Helvety servers.";
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    stageId: string | null;
    labelId: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    startDate: string | null;
    endDate: string | null;
    priority: number;
  }>;
}

const PLAINTEXT_EXPORT_WARNING =
  "This export file contains decrypted plaintext task data and can be read by anyone with access to your device. Continue?";

/**
 * Fetch, decrypt, and structure all task data for export.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 * @returns Structured, decrypted task data ready for download
 */
async function exportDecryptedTaskData(
  masterKey: CryptoKey
): Promise<DecryptedTaskExport> {
  // 1. Fetch all encrypted data from the server (export-specific rate limit + row cap)
  const result = await getAllTaskDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const { items: encryptedItems } = result.data;

  // 2. Decrypt all data client-side
  const items: Item[] = await decryptItemRows(encryptedItems, masterKey);

  return {
    exportedAt: new Date().toISOString(),
    service: "Helvety Tasks",
    note: "This export was decrypted client-side using your passkey. Plaintext task content is not sent to Helvety servers.",
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      stageId: item.stage_id,
      labelId: item.label_id,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      startDate: item.start_date,
      endDate: item.end_date,
      priority: item.priority,
    })),
  };
}

/**
 * Trigger a browser download of the decrypted task data as JSON.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 */
export async function downloadTaskDataExport(
  masterKey: CryptoKey,
  options: { requireConfirmation?: boolean } = {}
): Promise<void> {
  const { requireConfirmation = true } = options;
  if (requireConfirmation && !window.confirm(PLAINTEXT_EXPORT_WARNING)) {
    return;
  }

  const data = await exportDecryptedTaskData(masterKey);

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `helvety-tasks-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
