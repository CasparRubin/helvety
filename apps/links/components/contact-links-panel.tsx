"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { E2EE_APP_LINK_UI } from "@helvety/ui/e2ee-app-link-ui";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";

import { useContactLinks } from "@/hooks/use-contact-links";

import type { LinkedContact, PickerContact } from "@/hooks/use-contact-links";

const { sectionTitle, sectionIcon, pickerItemIcon } = E2EE_APP_LINK_UI.contacts;

/**
 *
 */
function formatContactName(contact: PickerContact | LinkedContact): string {
  return `${contact.first_name} ${contact.last_name}`.trim();
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
    `Are you sure you want to unlink "${name}" from this link? The contact itself will not be deleted.`,
};

/** Panel for linking/unlinking contacts to a bookmark. */
export function ContactLinksPanel({
  linkId,
}: {
  linkId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<PickerContact, LinkedContact>
      entityId={linkId}
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
      useLinks={useContactLinks}
    />
  );
}
