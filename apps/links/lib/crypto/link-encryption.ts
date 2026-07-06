/**
 * Link encryption helpers — thin wrappers over @helvety/shared/crypto/e2ee-entity-crypto.
 */

import {
  decryptLinkRow,
  encryptLinkCreate,
} from "@helvety/shared/crypto/e2ee-entity-crypto";

import type { Link, LinkInput, LinkRow } from "@/lib/types";

export async function encryptLinkInput(
  input: LinkInput,
  key: CryptoKey,
  folderId: string | null,
  recordId?: string
): Promise<{
  id: string;
  encrypted_name: string;
  encrypted_url: string;
  folder_id: string | null;
}> {
  return encryptLinkCreate({ ...input, folder_id: folderId }, key, recordId);
}

export async function decryptLinkRows(
  rows: LinkRow[],
  key: CryptoKey
): Promise<Link[]> {
  return Promise.all(rows.map((row) => decryptLinkRow(row, key)));
}

export { encryptLinkUpdate } from "@helvety/shared/crypto/e2ee-entity-crypto";
