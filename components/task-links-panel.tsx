"use client";

/**
 * TaskLinksPanel - Displays and manages task entities (Units, Spaces, Items)
 * linked to a contact.
 *
 * Supports bidirectional linking: users can link new entities via a searchable
 * picker and unlink existing ones with confirmation. Mirrors the visual style
 * of ContactLinksPanel in helvety-tasks for consistent cross-app UI/UX.
 */

import {
  BoxesIcon,
  BoxIcon,
  ExternalLinkIcon,
  Loader2Icon,
  ListChecksIcon,
  PlusIcon,
  SearchIcon,
  UnlinkIcon,
  VectorSquareIcon,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTaskLinks } from "@/hooks";

import type {
  LinkedUnit,
  LinkedSpace,
  LinkedItem,
  TaskEntityType,
  PickerUnit,
  PickerSpace,
  PickerItem,
} from "@/lib/types";

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

/** Human-readable label for an entity type */
function getEntityLabel(entityType: TaskEntityType): string {
  switch (entityType) {
    case "unit":
      return "unit";
    case "space":
      return "space";
    case "item":
      return "item";
  }
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * A single linked entity row with deep link and unlink button.
 */
function EntityRow({
  title,
  href,
  icon: Icon,
  onUnlink,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onUnlink: () => void;
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

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnlink();
                }}
                className="text-destructive hover:text-destructive"
              >
                <UnlinkIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Unlink</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0" />
      </div>
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

/**
 * Entity picker item in the search dropdown.
 */
function EntityPickerItem({
  title,
  icon: Icon,
  onSelect,
  isLinking,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  isLinking: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors disabled:pointer-events-none disabled:opacity-50"
      onClick={onSelect}
      disabled={isLinking}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
    </button>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Panel for linking/unlinking task entities to a contact.
 * Displays linked entities with deep links to the Tasks app and a
 * searchable picker to add new links. Mirrors ContactLinksPanel in
 * helvety-tasks for consistent bidirectional UX.
 */
export function TaskLinksPanel({
  contactId,
}: {
  contactId: string;
}): React.JSX.Element {
  const {
    units,
    spaces,
    items,
    totalCount,
    allEntities,
    isLoading,
    isLoadingEntities,
    error,
    loadEntities,
    link,
    unlink,
  } = useTaskLinks(contactId);

  // Picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Unlink confirmation state
  const [unlinkTarget, setUnlinkTarget] = useState<{
    linkId: string;
    title: string;
    entityType: string;
  } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Build sets of already-linked entity IDs for each type
  const linkedUnitIds = useMemo(() => new Set(units.map((u) => u.id)), [units]);
  const linkedSpaceIds = useMemo(
    () => new Set(spaces.map((s) => s.id)),
    [spaces]
  );
  const linkedItemIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  // Filter picker entities: exclude already-linked and apply search
  const filteredEntities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filterByQuery = <T extends { title: string }>(list: T[]): T[] => {
      if (!query) return list;
      return list.filter((e) => e.title.toLowerCase().includes(query));
    };

    const availableUnits = allEntities.units.filter(
      (u) => !linkedUnitIds.has(u.id)
    );
    const availableSpaces = allEntities.spaces.filter(
      (s) => !linkedSpaceIds.has(s.id)
    );
    const availableItems = allEntities.items.filter(
      (i) => !linkedItemIds.has(i.id)
    );

    return {
      units: filterByQuery(availableUnits),
      spaces: filterByQuery(availableSpaces),
      items: filterByQuery(availableItems),
    };
  }, [allEntities, linkedUnitIds, linkedSpaceIds, linkedItemIds, searchQuery]);

  const filteredTotal =
    filteredEntities.units.length +
    filteredEntities.spaces.length +
    filteredEntities.items.length;

  const allAvailableTotal =
    allEntities.units.filter((u) => !linkedUnitIds.has(u.id)).length +
    allEntities.spaces.filter((s) => !linkedSpaceIds.has(s.id)).length +
    allEntities.items.filter((i) => !linkedItemIds.has(i.id)).length;

  // Handle picker open: load entities lazily
  const handlePickerOpenChange = useCallback(
    (open: boolean) => {
      setIsPickerOpen(open);
      if (open) {
        void loadEntities();
        setSearchQuery("");
      }
    },
    [loadEntities]
  );

  // Handle linking an entity
  const handleLink = useCallback(
    async (entityType: TaskEntityType, entityId: string) => {
      setIsLinking(true);
      try {
        const success = await link(entityType, entityId);
        if (success) {
          setSearchQuery("");
          // Keep picker open so user can link more
        }
      } finally {
        setIsLinking(false);
      }
    },
    [link]
  );

  // Handle unlink click
  const handleUnlinkClick = useCallback(
    (linkId: string, title: string, entityType: string) => {
      setUnlinkTarget({ linkId, title, entityType });
    },
    []
  );

  // Handle unlink confirmation
  const handleUnlinkConfirm = useCallback(async () => {
    if (!unlinkTarget) return;
    setIsUnlinking(true);
    try {
      await unlink(unlinkTarget.linkId);
    } finally {
      setIsUnlinking(false);
      setUnlinkTarget(null);
    }
  }, [unlinkTarget, unlink]);

  return (
    <>
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecksIcon className="text-muted-foreground size-4" />
            <h3 className="text-muted-foreground text-sm font-medium">
              Linked Tasks
            </h3>
            {totalCount > 0 && (
              <span className="text-muted-foreground text-xs">
                ({totalCount})
              </span>
            )}
          </div>

          {/* Add entity button / picker */}
          <Popover open={isPickerOpen} onOpenChange={handlePickerOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <PlusIcon className="size-3.5" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 gap-0 p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {/* Search input */}
              <div className="border-b p-2">
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 text-xs"
                    autoFocus
                  />
                </div>
              </div>

              {/* Entity list */}
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {isLoadingEntities ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : filteredTotal === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      {allEntities.units.length === 0 &&
                      allEntities.spaces.length === 0 &&
                      allEntities.items.length === 0
                        ? "No entities found"
                        : searchQuery
                          ? "No matching entities"
                          : allAvailableTotal === 0
                            ? "All entities are already linked"
                            : "No entities available"}
                    </p>
                  ) : (
                    <>
                      {/* Units section */}
                      {filteredEntities.units.length > 0 && (
                        <div>
                          <p className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                            Units
                          </p>
                          {filteredEntities.units.map((unit: PickerUnit) => (
                            <EntityPickerItem
                              key={unit.id}
                              title={unit.title}
                              icon={VectorSquareIcon}
                              onSelect={() => handleLink("unit", unit.id)}
                              isLinking={isLinking}
                            />
                          ))}
                        </div>
                      )}

                      {/* Spaces section */}
                      {filteredEntities.spaces.length > 0 && (
                        <div>
                          <p className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                            Spaces
                          </p>
                          {filteredEntities.spaces.map((space: PickerSpace) => (
                            <EntityPickerItem
                              key={space.id}
                              title={space.title}
                              icon={BoxesIcon}
                              onSelect={() => handleLink("space", space.id)}
                              isLinking={isLinking}
                            />
                          ))}
                        </div>
                      )}

                      {/* Items section */}
                      {filteredEntities.items.length > 0 && (
                        <div>
                          <p className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                            Items
                          </p>
                          {filteredEntities.items.map((item: PickerItem) => (
                            <EntityPickerItem
                              key={item.id}
                              title={item.title}
                              icon={BoxIcon}
                              onSelect={() => handleLink("item", item.id)}
                              isLinking={isLinking}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
                onUnlink={() =>
                  handleUnlinkClick(unit.link_id, unit.title, "unit")
                }
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
                onUnlink={() =>
                  handleUnlinkClick(space.link_id, space.title, "space")
                }
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
                onUnlink={() =>
                  handleUnlinkClick(item.link_id, item.title, "item")
                }
              />
            ))}
          </EntitySection>
        )}

        {/* Empty state */}
        {!isLoading && totalCount === 0 && (
          <p className="text-muted-foreground py-2 text-center text-xs">
            No task entities linked yet
          </p>
        )}
      </div>

      {/* Unlink confirmation dialog */}
      <AlertDialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink &ldquo;{unlinkTarget?.title}
              &rdquo; from this contact? The{" "}
              {unlinkTarget
                ? getEntityLabel(unlinkTarget.entityType as TaskEntityType)
                : "entity"}{" "}
              itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleUnlinkConfirm}
              disabled={isUnlinking}
            >
              {isUnlinking ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Unlinking...
                </>
              ) : (
                "Unlink"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
