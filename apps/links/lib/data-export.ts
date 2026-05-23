import { getAllLinkDataForExport } from "@/app/actions/entity-actions";
import { decryptFolderRows, decryptLinkRows } from "@/lib/crypto";

/**
 *
 */
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

const PLAINTEXT_EXPORT_WARNING =
  "This export file contains decrypted plaintext bookmark data and can be read by anyone with access to your device. Continue?";

/** Decrypts link library rows for JSON export. */
async function exportDecryptedLinkData(
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

/**
 *
 */
function downloadLinksExport(data: DecryptedLinksExport): void {
  if (!window.confirm(PLAINTEXT_EXPORT_WARNING)) {
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `helvety-links-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Export and download decrypted link library data (for `useE2eeDataExport`). */
export async function downloadLinkDataExport(
  masterKey: CryptoKey
): Promise<void> {
  const data = await exportDecryptedLinkData(masterKey);
  downloadLinksExport(data);
}
