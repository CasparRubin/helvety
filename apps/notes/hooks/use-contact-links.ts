"use client";

import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getContacts,
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "@/app/actions/contact-link-actions";
import { decryptContactRows } from "@/lib/crypto";

import type { Contact } from "@/lib/types";

/** A linked contact with link metadata for unlinking. */
export interface LinkedContact extends Contact {
  /** `entity_links` row ID used for unlinking */
  link_id: string;
  linked_at: string;
}

/** Raw note-contact link row derived from `entity_links`. */
interface ItemContactLinkRow {
  id: string;
  note_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

const useContactLinksHook = createE2eeEntityLinksHook<
  Contact,
  LinkedContact,
  ItemContactLinkRow
>({
  fetchMode: "eager",
  source: "notes-use-contact-links",
  messages: {
    loadLinks: "Failed to load linked contacts",
    loadCatalog: "Failed to load contacts",
    link: "Failed to link contact",
    unlink: "Failed to unlink contact",
  },
  loadCatalog: getContacts,
  loadLinks: getItemContactLinks,
  decryptCatalog: async (data, key) =>
    decryptContactRows(data as Parameters<typeof decryptContactRows>[0], key),
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

/** Hook to manage contact links for a note. */
export function useContactLinks(
  itemId: string,
  options?: { enabled?: boolean }
) {
  return useContactLinksHook(itemId, options);
}
