import { urls } from "./config";

/** E2EE zones that support entity deep links in the URL query string. */
export type E2eeDeepLinkZone = "tasks" | "notes" | "contacts";

const ZONE_BASE_URL: Record<E2eeDeepLinkZone, string> = {
  tasks: urls.tasks,
  notes: urls.notes,
  contacts: urls.contacts,
};

const ZONE_QUERY_PARAM: Record<E2eeDeepLinkZone, string> = {
  tasks: "item",
  notes: "note",
  contacts: "contact",
};

/**
 * Builds a cross-app deep link to open an entity in its E2EE zone detail sheet.
 */
export function buildE2eeDeepLink(
  zone: E2eeDeepLinkZone,
  entityId: string
): string {
  const params = new URLSearchParams({
    [ZONE_QUERY_PARAM[zone]]: entityId,
  });
  return `${ZONE_BASE_URL[zone]}?${params.toString()}`;
}
