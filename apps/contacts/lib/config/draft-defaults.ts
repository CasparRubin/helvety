import { isDraftSnapshotUnchanged } from "@helvety/shared/e2ee-draft";

import { DEFAULT_CONTACT_CATEGORY_ID } from "@/lib/config/default-categories";

import type { Contact } from "@/lib/types";

export const CONTACT_DRAFT_FIRST_NAME = "New";
export const CONTACT_DRAFT_LAST_NAME = "Contact";

/** Snapshot fields compared when closing an unchanged contact draft. */
export interface ContactDraftSnapshot {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  description: string | null;
  notes: string | null;
  category_id: string;
}

/** Input for creating a new contact draft row. */
export function createContactDraftInput(
  categoryId = DEFAULT_CONTACT_CATEGORY_ID
): {
  first_name: string;
  last_name: string;
  description: null;
  email: null;
  phone: null;
  birthday: null;
  notes: null;
  category_id: string;
} {
  return {
    first_name: CONTACT_DRAFT_FIRST_NAME,
    last_name: CONTACT_DRAFT_LAST_NAME,
    description: null,
    email: null,
    phone: null,
    birthday: null,
    notes: null,
    category_id: categoryId,
  };
}

/** Builds the snapshot stored when a new contact draft is opened. */
export function createContactDraftSnapshot(
  categoryId = DEFAULT_CONTACT_CATEGORY_ID
): ContactDraftSnapshot {
  return {
    first_name: CONTACT_DRAFT_FIRST_NAME,
    last_name: CONTACT_DRAFT_LAST_NAME,
    email: null,
    phone: null,
    birthday: null,
    description: null,
    notes: null,
    category_id: categoryId,
  };
}

/** Returns true when the contact still matches its open-draft snapshot. */
export function isContactDraftUnchanged(
  contact: Pick<
    Contact,
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "birthday"
    | "description"
    | "notes"
    | "category_id"
  >,
  snapshot: ContactDraftSnapshot
): boolean {
  return isDraftSnapshotUnchanged(
    {
      first_name: contact.first_name.trim(),
      last_name: contact.last_name.trim(),
      email: contact.email,
      phone: contact.phone,
      birthday: contact.birthday,
      description: contact.description,
      notes: contact.notes,
      category_id: contact.category_id,
    },
    snapshot
  );
}
