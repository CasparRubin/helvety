/**
 * Client-side data export for Helvety Tasks — fetch, decrypt, and download JSON.
 * Download plumbing is shared via `@helvety/shared/e2ee-json-export`.
 */

import { downloadEncryptedJsonExport } from "@helvety/shared/e2ee-json-export";

import { getAllTaskDataForExport } from "@/app/actions/entity-actions";
import { decryptItemRows } from "@/lib/crypto";

import type { Item } from "@/lib/types";

/** Decrypted task export payload written to the downloaded JSON file. */
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

/** Fetches encrypted rows and decrypts them into the task export shape. */
async function buildTaskExportData(
  masterKey: CryptoKey
): Promise<DecryptedTaskExport> {
  const result = await getAllTaskDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const items: Item[] = await decryptItemRows(result.data.items, masterKey);

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

/** Export and download decrypted task data (for `useE2eeDataExport`). */
export async function downloadTaskDataExport(
  masterKey: CryptoKey,
  options: { requireConfirmation?: boolean } = {}
): Promise<void> {
  const { requireConfirmation = true } = options;
  await downloadEncryptedJsonExport({
    masterKey,
    buildExportData: buildTaskExportData,
    filenamePrefix: "helvety-tasks-export",
    entityLabel: "task",
    requireConfirmation,
  });
}
