/**
 * Client-side data export utility for Helvety Tasks.
 *
 * Fetches all encrypted task data from the server, decrypts it client-side
 * using the user's master key, and provides a downloadable JSON export.
 *
 * Legal basis: nDSG Art. 28 (right to data portability; data must be
 * provided in a structured, commonly used format).
 *
 * IMPORTANT: Decryption happens entirely client-side. The server never
 * has access to the plaintext task data.
 */

import { getAllTaskDataForExport } from "@/app/actions/task-actions";
import {
  decryptUnitRows,
  decryptSpaceRows,
  decryptItemRows,
} from "@/lib/crypto";

import type { Unit, Space, Item } from "@/lib/types";

/** Structure of the exported (decrypted) task data */
export interface DecryptedTaskExport {
  exportedAt: string;
  service: "helvety-tasks";
  note: "This export was decrypted client-side using your passkey. Helvety servers never had access to this plaintext data.";
  units: Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    spaces: Array<{
      id: string;
      title: string;
      description: string | null;
      createdAt: string;
      items: Array<{
        id: string;
        title: string;
        description: string | null;
        priority: number;
        createdAt: string;
      }>;
    }>;
  }>;
}

/**
 * Fetch, decrypt, and structure all task data for export.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 * @returns Structured, decrypted task data ready for download
 */
export async function exportDecryptedTaskData(
  masterKey: CryptoKey
): Promise<DecryptedTaskExport> {
  // 1. Fetch all encrypted data from the server
  const result = await getAllTaskDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const {
    units: encryptedUnits,
    spaces: encryptedSpaces,
    items: encryptedItems,
  } = result.data;

  // 2. Decrypt all data client-side
  const units: Unit[] = await decryptUnitRows(encryptedUnits, masterKey);
  const spaces: Space[] = await decryptSpaceRows(encryptedSpaces, masterKey);
  const items: Item[] = await decryptItemRows(encryptedItems, masterKey);

  // 3. Build hierarchical structure (units → spaces → items)
  const spacesByUnit = new Map<string, Space[]>();
  for (const space of spaces) {
    const existing = spacesByUnit.get(space.unit_id) ?? [];
    existing.push(space);
    spacesByUnit.set(space.unit_id, existing);
  }

  const itemsBySpace = new Map<string, Item[]>();
  for (const item of items) {
    const existing = itemsBySpace.get(item.space_id) ?? [];
    existing.push(item);
    itemsBySpace.set(item.space_id, existing);
  }

  return {
    exportedAt: new Date().toISOString(),
    service: "helvety-tasks",
    note: "This export was decrypted client-side using your passkey. Helvety servers never had access to this plaintext data.",
    units: units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      createdAt: unit.created_at,
      spaces: (spacesByUnit.get(unit.id) ?? []).map((space) => ({
        id: space.id,
        title: space.title,
        description: space.description,
        createdAt: space.created_at,
        items: (itemsBySpace.get(space.id) ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          priority: item.priority,
          createdAt: item.created_at,
        })),
      })),
    })),
  };
}

/**
 * Trigger a browser download of the decrypted task data as JSON.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 */
export async function downloadTaskDataExport(
  masterKey: CryptoKey
): Promise<void> {
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
