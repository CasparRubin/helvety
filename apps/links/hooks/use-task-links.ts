"use client";

import { decryptItemDisplayTitle } from "@helvety/shared/crypto";
import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getLinkTaskLinks,
  getTaskEntities,
  linkTaskEntity,
  unlinkTaskEntity,
} from "@/app/actions/task-link-actions";

export interface LinkedTask {
  id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

export interface PickerTask {
  id: string;
  title: string;
}

interface TaskLinkData {
  items: {
    id: string;
    encrypted_title: string;
    link_id: string;
    linked_at: string;
  }[];
}

interface TaskEntitiesData {
  items: { id: string; encrypted_title: string }[];
}

const useTaskLinksHook = createE2eeEntityLinksHook<
  PickerTask,
  LinkedTask,
  { id: string },
  TaskLinkData,
  TaskEntitiesData
>({
  fetchMode: "lazyCatalog",
  source: "links-use-task-links",
  messages: {
    loadLinks: "Failed to load task links",
    loadCatalog: "Failed to load tasks",
    link: "Failed to link task",
    unlink: "Failed to unlink task",
  },
  loadLinks: getLinkTaskLinks,
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
  link: (linkId, itemId, csrfToken) =>
    linkTaskEntity(itemId, linkId, csrfToken),
  unlink: unlinkTaskEntity,
});

/** Hook to fetch, decrypt, link, and unlink tasks for a bookmark. */
export function useTaskLinks(linkId: string, options?: { enabled?: boolean }) {
  return useTaskLinksHook(linkId, options);
}
