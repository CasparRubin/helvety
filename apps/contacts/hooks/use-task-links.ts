"use client";

import { decryptItemDisplayTitle } from "@helvety/shared/crypto";
import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getContactTaskLinks,
  getTaskEntities,
  linkTaskEntity,
  unlinkTaskEntity,
} from "@/app/actions/task-link-actions";

import type {
  LinkedItem,
  PickerItem,
  TaskEntitiesData,
  TaskLinkData,
} from "@/lib/types";

const useTaskLinksHook = createE2eeEntityLinksHook<
  PickerItem,
  LinkedItem,
  { id: string },
  TaskLinkData,
  TaskEntitiesData
>({
  fetchMode: "lazyCatalog",
  source: "contacts-use-task-links",
  messages: {
    loadLinks: "Failed to load task links",
    loadCatalog: "Failed to load tasks",
    link: "Failed to link task",
    unlink: "Failed to unlink task",
  },
  loadLinks: getContactTaskLinks,
  loadCatalog: getTaskEntities,
  decryptLinked: async (data, key) =>
    Promise.all(
      data.items.map(async (item) => ({
        id: item.id,
        title: await decryptItemDisplayTitle(
          item.encrypted_title,
          item.id,
          key
        ),
        link_id: item.link_id,
        linked_at: item.linked_at,
      }))
    ),
  decryptCatalog: async (data, key) =>
    Promise.all(
      data.items.map(async (item) => ({
        id: item.id,
        title: await decryptItemDisplayTitle(
          item.encrypted_title,
          item.id,
          key
        ),
      }))
    ),
  link: (contactId, itemId, csrfToken) =>
    linkTaskEntity(itemId, contactId, csrfToken),
  unlink: unlinkTaskEntity,
});

/** Hook to fetch, decrypt, link, and unlink task links for a contact. */
export function useTaskLinks(
  contactId: string,
  options?: { enabled?: boolean }
) {
  return useTaskLinksHook(contactId, options);
}
