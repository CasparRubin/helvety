/**
 * Client-side data export for Helvety Links — fetch, decrypt, and download JSON.
 * Download plumbing is shared via `@helvety/shared/e2ee-json-export`.
 */

import { downloadEncryptedJsonExport } from "@helvety/shared/e2ee-json-export";

import { getAllLinkDataForExport } from "@/app/actions/entity-actions";
import { decryptFolderRows, decryptLinkRows } from "@/lib/crypto";

/** Decrypted link library export payload written to the downloaded JSON file. */
interface DecryptedLinksExport {
  exportedAt: string;
  service: "Helvety Links";
  note: string;
  folders: Array<{
    id: string;
    name: string;
    parentFolderId: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  links: Array<{
    id: string;
    name: string;
    url: string;
    folderId: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

/** Fetches encrypted rows and decrypts them into the link export shape. */
async function buildLinkExportData(
  masterKey: CryptoKey
): Promise<DecryptedLinksExport> {
  const result = await getAllLinkDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const [folders, links] = await Promise.all([
    decryptFolderRows(result.data.folders, masterKey),
    decryptLinkRows(result.data.links, masterKey),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    service: "Helvety Links",
    note: "This export was decrypted client-side using your passkey.",
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentFolderId: f.parent_folder_id,
      sortOrder: f.sort_order,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    })),
    links: links.map((l) => ({
      id: l.id,
      name: l.name,
      url: l.url,
      folderId: l.folder_id,
      sortOrder: l.sort_order,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    })),
  };
}

/** Export and download decrypted link library data (for `useE2eeDataExport`). */
export async function downloadLinkDataExport(
  masterKey: CryptoKey
): Promise<void> {
  await downloadEncryptedJsonExport({
    masterKey,
    buildExportData: buildLinkExportData,
    filenamePrefix: "helvety-links-export",
    entityLabel: "bookmark",
  });
}
