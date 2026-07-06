/**
 * Contact Encryption Helpers
 * Thin re-exports from @helvety/shared/crypto/e2ee-entity-crypto.
 */

import { decryptContactRow } from "@helvety/shared/crypto/e2ee-entity-crypto";

import type { Contact, ContactRow } from "@/lib/types";

export {
  decryptContactRow,
  encryptContactUpdate,
} from "@helvety/shared/crypto/e2ee-entity-crypto";

export { encryptContactCreate as encryptContactInput } from "@helvety/shared/crypto/e2ee-entity-crypto";

export async function decryptContactRows(
  rows: ContactRow[],
  key: CryptoKey
): Promise<Contact[]> {
  return Promise.all(rows.map((row) => decryptContactRow(row, key)));
}
