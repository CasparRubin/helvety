/**
 * Client-side data export utility for Helvety Contacts.
 *
 * Fetches all encrypted contact data from the server, decrypts it client-side
 * using the user's master key, and provides a downloadable JSON export.
 *
 * Legal basis: nDSG Art. 28 (right to data portability; data must be
 * provided in a structured, commonly used format).
 *
 * IMPORTANT: Decryption happens entirely client-side. The server never
 * has access to the plaintext contact data.
 */

import { getContacts } from "@/app/actions/contact-actions";
import { decryptContactRows } from "@/lib/crypto";

import type { Contact } from "@/lib/types";

/** Structure of the exported (decrypted) contact data */
export interface DecryptedContactExport {
  exportedAt: string;
  service: "Helvety Contacts";
  note: "This export was decrypted client-side using your passkey. Helvety servers never had access to this plaintext data.";
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    description: string | null;
    email: string | null;
    phone: string | null;
    birthday: string | null;
    notes: string | null;
    categoryId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * Fetch, decrypt, and structure all contact data for export.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 * @returns Structured, decrypted contact data ready for download
 */
export async function exportDecryptedContactData(
  masterKey: CryptoKey
): Promise<DecryptedContactExport> {
  // 1. Fetch all encrypted data from the server
  const result = await getContacts();
  if (!result.success) {
    throw new Error(result.error);
  }

  // 2. Decrypt all data client-side
  const contacts: Contact[] = await decryptContactRows(result.data, masterKey);

  // 3. Build export structure
  return {
    exportedAt: new Date().toISOString(),
    service: "Helvety Contacts",
    note: "This export was decrypted client-side using your passkey. Helvety servers never had access to this plaintext data.",
    contacts: contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      description: contact.description,
      email: contact.email,
      phone: contact.phone,
      birthday: contact.birthday,
      notes: contact.notes,
      categoryId: contact.category_id,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    })),
  };
}

/**
 * Trigger a browser download of the decrypted contact data as JSON.
 *
 * @param masterKey - The user's decryption key (from EncryptionContext)
 */
export async function downloadContactDataExport(
  masterKey: CryptoKey
): Promise<void> {
  const data = await exportDecryptedContactData(masterKey);

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `helvety-contacts-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
