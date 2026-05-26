"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";
import { UsersIcon } from "lucide-react";

import { useContactLinks } from "@/hooks/use-contact-links";

import type { LinkedContact } from "@/hooks/use-contact-links";
import type { Contact } from "@/lib/types";

/** Formats a contact display name for link panels. */
function formatContactName(contact: Contact | LinkedContact): string {
  return `${contact.first_name} ${contact.last_name}`.trim();
}

/** Adapts `useContactLinks` to the shared entity links panel hook shape. */
function useContactLinksForPanel(
  entityId: string,
  options: { enabled: boolean }
) {
  const { allItems, linkedItems, isLoading, link, unlink } = useContactLinks(
    entityId,
    options
  );
  return {
    allItems,
    linkedItems,
    isLoading,
    link,
    unlink,
  };
}

const CONTACT_LINK_LABELS = {
  sectionTitle: "Contacts",
  searchPlaceholder: "Search contacts...",
  emptyCatalog: "No contacts found",
  emptySearch: "No matching contacts",
  allLinked: "All contacts are already linked",
  noLinkedYet: "No contacts linked yet",
  unlinkTitle: "Unlink Contact",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this note? The contact itself will not be deleted.`,
};

/** Panel for linking/unlinking contacts to a note. */
export function ContactLinksPanel({
  itemId,
}: {
  itemId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<Contact, LinkedContact>
      entityId={itemId}
      variant="static"
      labels={CONTACT_LINK_LABELS}
      sectionIcon={UsersIcon}
      pickerItemIcon={UsersIcon}
      getDeepLink={(id) => buildE2eeDeepLink("contacts", id)}
      formatName={formatContactName}
      filterCatalogItem={(contact, query) => {
        const name = formatContactName(contact).toLowerCase();
        const email = contact.email?.toLowerCase() ?? "";
        return name.includes(query) || email.includes(query);
      }}
      renderLinkedSubtitle={(contact) =>
        contact.email ? (
          <p className="text-muted-foreground truncate text-xs">
            {contact.email}
          </p>
        ) : null
      }
      renderPickerSubtitle={(contact) =>
        contact.email ? (
          <p className="text-muted-foreground truncate text-xs">
            {contact.email}
          </p>
        ) : null
      }
      useLinks={useContactLinksForPanel}
    />
  );
}
