"use client";

import {
  decryptLinkDisplayName,
  decryptLinkDisplayUrl,
} from "@helvety/shared/crypto";
import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getContactLinkEntityLinks,
  getLinkEntities,
  linkLinkEntity,
  unlinkLinkEntity,
} from "@/app/actions/link-entity-link-actions";

import type {
  ContactLinkEntityLinkData,
  LinkEntitiesData,
} from "@/app/actions/link-entity-link-actions";

/**
 *
 */
export interface LinkedLinkEntity {
  id: string;
  name: string;
  url: string;
  link_id: string;
  linked_at: string;
}

/**
 *
 */
export interface PickerLinkEntity {
  id: string;
  name: string;
  url: string;
}

/**
 *
 */
async function decryptLinkRows(
  rows: {
    id: string;
    encrypted_name: string;
    encrypted_url: string;
    link_id?: string;
    linked_at?: string;
  }[],
  key: CryptoKey
): Promise<LinkedLinkEntity[]> {
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      name: await decryptLinkDisplayName(row.encrypted_name, row.id, key),
      url: await decryptLinkDisplayUrl(row.encrypted_url, row.id, key),
      link_id: row.link_id ?? "",
      linked_at: row.linked_at ?? "",
    }))
  );
}

/**
 *
 */
async function decryptLinkCatalog(
  rows: { id: string; encrypted_name: string; encrypted_url: string }[],
  key: CryptoKey
): Promise<PickerLinkEntity[]> {
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      name: await decryptLinkDisplayName(row.encrypted_name, row.id, key),
      url: await decryptLinkDisplayUrl(row.encrypted_url, row.id, key),
    }))
  );
}

const useLinkEntityLinksHook = createE2eeEntityLinksHook<
  PickerLinkEntity,
  LinkedLinkEntity,
  { id: string },
  ContactLinkEntityLinkData,
  LinkEntitiesData
>({
  fetchMode: "lazyCatalog",
  source: "contacts-use-link-entity-links",
  messages: {
    loadLinks: "Failed to load linked bookmarks",
    loadCatalog: "Failed to load links",
    link: "Failed to link bookmark",
    unlink: "Failed to unlink bookmark",
  },
  loadLinks: getContactLinkEntityLinks,
  loadCatalog: getLinkEntities,
  decryptLinked: async (data, key) => decryptLinkRows(data.links, key),
  decryptCatalog: async (data, key) => decryptLinkCatalog(data.links, key),
  link: (contactId, linkId, csrfToken) =>
    linkLinkEntity(linkId, contactId, csrfToken),
  unlink: unlinkLinkEntity,
});

/** Hook to fetch, decrypt, link, and unlink bookmarks for a contact. */
export function useLinkEntityLinks(
  contactId: string,
  options?: { enabled?: boolean }
) {
  return useLinkEntityLinksHook(contactId, options);
}
