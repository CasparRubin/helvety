"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { E2EE_APP_LINK_UI } from "@helvety/ui/e2ee-app-link-ui";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";

import { useContactLinks } from "@/hooks/use-contact-links";

import type { LinkedContact } from "@/hooks/use-contact-links";
import type { Contact } from "@/lib/types";

const { sectionTitle, sectionIcon, pickerItemIcon } = E2EE_APP_LINK_UI.contacts;

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
  sectionTitle,
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
      labels={CONTACT_LINK_LABELS}
      sectionIcon={sectionIcon}
      pickerItemIcon={pickerItemIcon}
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
