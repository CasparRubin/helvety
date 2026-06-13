"use client";

import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getContactEntities,
  getLinkContactLinks,
  linkContactEntity,
  unlinkContactEntity,
} from "@/app/actions/contact-link-actions";
import { buildAAD, decrypt, parseEncryptedData } from "@/lib/crypto";

export interface LinkedContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  link_id: string;
  linked_at: string;
}

export interface PickerContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface ContactLinkData {
  contacts: {
    id: string;
    encrypted_first_name: string;
    encrypted_last_name: string;
    encrypted_email: string | null;
    link_id: string;
    linked_at: string;
  }[];
}

interface ContactEntitiesData {
  contacts: {
    id: string;
    encrypted_first_name: string;
    encrypted_last_name: string;
    encrypted_email: string | null;
  }[];
}

async function decryptContactRows(
  rows: {
    id: string;
    encrypted_first_name: string;
    encrypted_last_name: string;
    encrypted_email: string | null;
    link_id?: string;
    linked_at?: string;
  }[],
  key: CryptoKey
): Promise<LinkedContact[]> {
  return Promise.all(
    rows.map(async (row) => {
      const aad = buildAAD("contacts", row.id);
      const firstName = await decrypt(
        parseEncryptedData(row.encrypted_first_name),
        key,
        aad
      );
      const lastName = await decrypt(
        parseEncryptedData(row.encrypted_last_name),
        key,
        aad
      );
      const email = row.encrypted_email
        ? await decrypt(parseEncryptedData(row.encrypted_email), key, aad)
        : null;
      return {
        id: row.id,
        first_name: firstName,
        last_name: lastName,
        email,
        link_id: row.link_id ?? "",
        linked_at: row.linked_at ?? "",
      };
    })
  );
}

async function decryptContactCatalog(
  rows: ContactEntitiesData["contacts"],
  key: CryptoKey
): Promise<PickerContact[]> {
  const decrypted = await decryptContactRows(rows, key);
  return decrypted.map((contact) => ({
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
  }));
}

const useContactLinksHook = createE2eeEntityLinksHook<
  PickerContact,
  LinkedContact,
  { id: string },
  ContactLinkData,
  ContactEntitiesData
>({
  fetchMode: "lazyCatalog",
  source: "links-use-contact-links",
  messages: {
    loadLinks: "Failed to load contact links",
    loadCatalog: "Failed to load contacts",
    link: "Failed to link contact",
    unlink: "Failed to unlink contact",
  },
  loadLinks: getLinkContactLinks,
  loadCatalog: getContactEntities,
  decryptLinked: async (data, key) => decryptContactRows(data.contacts, key),
  decryptCatalog: async (data, key) =>
    decryptContactCatalog(data.contacts, key),
  link: (linkId, contactId, csrfToken) =>
    linkContactEntity(contactId, linkId, csrfToken),
  unlink: unlinkContactEntity,
});

/** Hook to fetch, decrypt, link, and unlink contacts for a bookmark. */
export function useContactLinks(
  linkId: string,
  options?: { enabled?: boolean }
) {
  return useContactLinksHook(linkId, options);
}
