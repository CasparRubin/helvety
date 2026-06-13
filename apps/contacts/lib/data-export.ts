/**
 * Client-side data export for Helvety Contacts — fetch, decrypt, and download JSON.
 * Download plumbing is shared via `@helvety/shared/e2ee-json-export`.
 */

import { downloadEncryptedJsonExport } from "@helvety/shared/e2ee-json-export";

import { getAllContactDataForExport } from "@/app/actions/contact-actions";
import { decryptContactRows } from "@/lib/crypto";

import type { Contact } from "@/lib/types";

/** Decrypted contact export payload written to the downloaded JSON file. */
interface DecryptedContactExport {
  exportedAt: string;
  service: "Helvety Contacts";
  note: "This export was decrypted client-side using your passkey. Plaintext contact content is not sent to Helvety servers.";
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    description: string | null;
    email: string | null;
    phone: string | null;
    birthday: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

/** Fetches encrypted rows and decrypts them into the contact export shape. */
async function buildContactExportData(
  masterKey: CryptoKey
): Promise<DecryptedContactExport> {
  const result = await getAllContactDataForExport();
  if (!result.success) {
    throw new Error(result.error);
  }

  const contacts: Contact[] = await decryptContactRows(result.data, masterKey);

  return {
    exportedAt: new Date().toISOString(),
    service: "Helvety Contacts",
    note: "This export was decrypted client-side using your passkey. Plaintext contact content is not sent to Helvety servers.",
    contacts: contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      description: contact.description,
      email: contact.email,
      phone: contact.phone,
      birthday: contact.birthday,
      notes: contact.notes,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    })),
  };
}

/** Export and download decrypted contact data (for `useE2eeDataExport`). */
export async function downloadContactDataExport(
  masterKey: CryptoKey,
  options: { requireConfirmation?: boolean } = {}
): Promise<void> {
  const { requireConfirmation = true } = options;
  await downloadEncryptedJsonExport({
    masterKey,
    buildExportData: buildContactExportData,
    filenamePrefix: "helvety-contacts-export",
    entityLabel: "contact",
    requireConfirmation,
  });
}
