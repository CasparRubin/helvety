/**
 * Link folder encryption helpers — thin wrappers over @helvety/shared/crypto/e2ee-entity-crypto.
 */

import {
  decryptLinkFolderRow,
  encryptLinkFolderCreate,
} from "@helvety/shared/crypto/e2ee-entity-crypto";

import type { LinkFolder, LinkFolderInput, LinkFolderRow } from "@/lib/types";

export async function encryptFolderInput(
  input: LinkFolderInput,
  key: CryptoKey,
  parentFolderId: string | null,
  recordId?: string
): Promise<{
  id: string;
  encrypted_name: string;
  parent_folder_id: string | null;
}> {
  return encryptLinkFolderCreate(
    { ...input, parent_folder_id: parentFolderId },
    key,
    recordId
  );
}

export async function decryptFolderRows(
  rows: LinkFolderRow[],
  key: CryptoKey
): Promise<LinkFolder[]> {
  return Promise.all(rows.map((row) => decryptLinkFolderRow(row, key)));
}

export { encryptLinkFolderUpdate as encryptFolderUpdate } from "@helvety/shared/crypto/e2ee-entity-crypto";
