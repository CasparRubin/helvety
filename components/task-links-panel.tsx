"use client";

/**
 * TaskLinksPanel - Displays task entities (Units, Spaces, Items) linked to a contact.
 *
 * This is a read-only panel. Links are managed in the Tasks app; this panel
 * simply displays them with deep links so the user can navigate to the
 * corresponding entity in the Tasks app.
 *
 * Mirrors the visual style of ContactLinksPanel in helvety-tasks for
 * consistent cross-app UI/UX.
 */

import {
  BoxesIcon,
  BoxIcon,
  ExternalLinkIcon,
  Loader2Icon,
  ListChecksIcon,
  VectorSquareIcon,
} from "lucide-react";

import { useTaskLinks } from "@/hooks";

import type { LinkedUnit, LinkedSpace, LinkedItem } from "@/lib/types";

// =============================================================================
// Helpers
// =============================================================================

const TASKS_APP_URL =
  process.env.NEXT_PUBLIC_TASKS_URL ?? "https://tasks.helvety.com";

/** Build a deep link URL to a unit in the Tasks app */
function getUnitDeepLink(unitId: string): string {
  return `${TASKS_APP_URL}/units/${unitId}`;
}

/** Build a deep link URL to a space in the Tasks app */
function getSpaceDeepLink(unitId: string, spaceId: string): string {
  return `${TASKS_APP_URL}/units/${unitId}/spaces/${spaceId}`;
}

/** Build a deep link URL to an item in the Tasks app */
function getItemDeepLink(
  unitId: string,
  spaceId: string,
  itemId: string
): string {
  return `${TASKS_APP_URL}/units/${unitId}/spaces/${spaceId}/items/${itemId}`;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * A single linked entity row rendered as a clickable link to the Tasks app.
 */
function EntityRow({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}): React.JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      {/* Entity icon + title */}
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
      </div>

      {/* External link indicator */}
      <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

/**
 * Section for a single entity type (units, spaces, or items).
 */
function EntitySection({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
        {count > 0 && (
          <span className="text-muted-foreground text-xs">({count})</span>
        )}
      </div>

      {/* Entity rows */}
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Panel displaying task entities linked to a contact.
 * Shows separate sections for Units, Spaces, and Items with deep links
 * to the Tasks app. Only renders when at least one link exists.
 */
export function TaskLinksPanel({
  contactId,
}: {
  contactId: string;
}): React.JSX.Element | null {
  const { units, spaces, items, totalCount, isLoading, error } =
    useTaskLinks(contactId);

  // Don't render anything if there are no links and we're not loading
  if (!isLoading && totalCount === 0 && !error) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center gap-2">
        <ListChecksIcon className="text-muted-foreground size-4" />
        <h3 className="text-muted-foreground text-sm font-medium">
          Linked Tasks
        </h3>
        {totalCount > 0 && (
          <span className="text-muted-foreground text-xs">({totalCount})</span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && totalCount === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="text-destructive py-2 text-center text-xs">{error}</p>
      )}

      {/* Units section */}
      {units.length > 0 && (
        <EntitySection
          icon={VectorSquareIcon}
          label="Units"
          count={units.length}
        >
          {units.map((unit: LinkedUnit) => (
            <EntityRow
              key={unit.link_id}
              title={unit.title}
              href={getUnitDeepLink(unit.id)}
              icon={VectorSquareIcon}
            />
          ))}
        </EntitySection>
      )}

      {/* Spaces section */}
      {spaces.length > 0 && (
        <EntitySection icon={BoxesIcon} label="Spaces" count={spaces.length}>
          {spaces.map((space: LinkedSpace) => (
            <EntityRow
              key={space.link_id}
              title={space.title}
              href={getSpaceDeepLink(space.unit_id, space.id)}
              icon={BoxesIcon}
            />
          ))}
        </EntitySection>
      )}

      {/* Items section */}
      {items.length > 0 && (
        <EntitySection icon={BoxIcon} label="Items" count={items.length}>
          {items.map((item: LinkedItem) => (
            <EntityRow
              key={item.link_id}
              title={item.title}
              href={getItemDeepLink(item.unit_id, item.space_id, item.id)}
              icon={BoxIcon}
            />
          ))}
        </EntitySection>
      )}
    </div>
  );
}
