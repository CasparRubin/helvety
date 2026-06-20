"use client";

import {
  decryptEntityField,
  parseEncryptedData,
} from "@helvety/shared/crypto/encryption";
import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getContacts,
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "@/app/actions/contact-link-actions";

import type { Contact } from "@/lib/types";

const CONTACTS_TABLE = "contacts" as const;

/** A linked contact with link metadata for unlinking. */
export interface LinkedContact extends Contact {
  /** `entity_links` row ID used for unlinking */
  link_id: string;
  linked_at: string;
}

/**
 *
 */
interface ContactPickerRow {
  id: string;
  user_id: string;
  encrypted_first_name: string;
  encrypted_last_name: string;
  encrypted_email: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Raw link row from `entity_links`. */
interface ItemContactLinkRow {
  id: string;
  item_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

/**
 *
 */
async function decryptContactPickerRows(
  rows: ContactPickerRow[],
  key: CryptoKey
): Promise<Contact[]> {
  return Promise.all(
    rows.map(async (row) => {
      const ctx = { table: CONTACTS_TABLE, recordId: row.id };
      const firstName = await decryptEntityField(
        parseEncryptedData(row.encrypted_first_name),
        key,
        { ...ctx, column: "encrypted_first_name" }
      );
      const lastName = await decryptEntityField(
        parseEncryptedData(row.encrypted_last_name),
        key,
        { ...ctx, column: "encrypted_last_name" }
      );
      const email = row.encrypted_email
        ? await decryptEntityField(
            parseEncryptedData(row.encrypted_email),
            key,
            { ...ctx, column: "encrypted_email" }
          )
        : null;

      return {
        id: row.id,
        user_id: row.user_id,
        first_name: firstName,
        last_name: lastName,
        description: null,
        email,
        phone: null,
        birthday: null,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    })
  );
}

const useContactLinksHook = createE2eeEntityLinksHook<
  Contact,
  LinkedContact,
  ItemContactLinkRow
>({
  fetchMode: "eager",
  source: "tasks-use-contact-links",
  messages: {
    loadLinks: "Failed to load linked contacts",
    loadCatalog: "Failed to load contacts",
    link: "Failed to link contact",
    unlink: "Failed to unlink contact",
  },
  loadCatalog: getContacts,
  loadLinks: getItemContactLinks,
  decryptCatalog: async (data, key) =>
    decryptContactPickerRows(data as ContactPickerRow[], key),
  joinLinked: (catalog, linkRows) => {
    const contactsById = new Map(
      catalog.map((contact) => [contact.id, contact])
    );
    return linkRows
      .map((linkRow) => {
        const contact = contactsById.get(linkRow.contact_id);
        if (!contact) return null;
        return {
          ...contact,
          link_id: linkRow.id,
          linked_at: linkRow.created_at,
        };
      })
      .filter((contact): contact is LinkedContact => contact !== null);
  },
  link: linkContact,
  unlink: unlinkContact,
});

/**
 * Hook to manage contact links for a task item.
 * Fetches contacts and links, decrypts client-side, and provides link/unlink.
 */
export function useContactLinks(
  itemId: string,
  options?: { enabled?: boolean }
) {
  return useContactLinksHook(itemId, options);
}
