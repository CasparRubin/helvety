"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { E2EE_APP_LINK_UI } from "@helvety/ui/e2ee-app-link-ui";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";

import { useLinkEntityLinks } from "@/hooks/use-link-entity-links";

import type {
  LinkedLinkEntity,
  PickerLinkEntity,
} from "@/hooks/use-link-entity-links";

const { sectionTitle, sectionIcon, pickerItemIcon } = E2EE_APP_LINK_UI.links;

const LINK_ENTITY_LINK_LABELS = {
  sectionTitle,
  searchPlaceholder: "Search links...",
  emptyCatalog: "No links found",
  emptySearch: "No matching links",
  allLinked: "All links are already linked",
  noLinkedYet: "No links linked yet",
  unlinkTitle: "Unlink Link",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this task? The link itself will not be deleted.`,
};

/** Panel for linking/unlinking bookmarks to a task. */
export function LinkEntityLinksPanel({
  itemId,
}: {
  itemId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<PickerLinkEntity, LinkedLinkEntity>
      entityId={itemId}
      labels={LINK_ENTITY_LINK_LABELS}
      sectionIcon={sectionIcon}
      pickerItemIcon={pickerItemIcon}
      getDeepLink={(id) => buildE2eeDeepLink("links", id)}
      formatName={(link) => link.name}
      filterCatalogItem={(link, query) => {
        const name = link.name.toLowerCase();
        const url = link.url.toLowerCase();
        return name.includes(query) || url.includes(query);
      }}
      renderLinkedSubtitle={(link) =>
        link.url ? (
          <p className="text-muted-foreground truncate text-xs">{link.url}</p>
        ) : null
      }
      renderPickerSubtitle={(link) =>
        link.url ? (
          <p className="text-muted-foreground truncate text-xs">{link.url}</p>
        ) : null
      }
      useLinks={useLinkEntityLinks}
    />
  );
}
