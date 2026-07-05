"use client";

import { Loader2Icon, PlusIcon, UnlinkIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Linked entity row with server link id for unlink. */
export type EntityLinkRow = {
  id: string;
  link_id: string;
};

/** Copy and labels for an entity links panel. */
export type EntityLinksPanelLabels = {
  sectionTitle: string;
  searchPlaceholder: string;
  emptyCatalog: string;
  emptySearch: string;
  allLinked: string;
  noLinkedYet: string;
  unlinkTitle: string;
  unlinkDescription: (name: string) => string;
};

/** Result of a per-app entity links hook. */
export type EntityLinksHookResult<TCatalog, TLinked extends EntityLinkRow> = {
  allItems: TCatalog[];
  linkedItems: TLinked[];
  isLoading: boolean;
  link: (targetId: string) => Promise<boolean>;
  unlink: (linkId: string) => Promise<void | boolean>;
};

/** Props for the shared entity links panel shell. */
export type EntityLinksPanelProps<
  TCatalog extends { id: string },
  TLinked extends EntityLinkRow,
> = {
  entityId: string;
  labels: EntityLinksPanelLabels;
  sectionIcon: LucideIcon;
  pickerItemIcon: LucideIcon;
  getDeepLink: (targetId: string) => string;
  formatName: (item: TCatalog | TLinked) => string;
  renderLinkedSubtitle?: (item: TLinked) => ReactNode;
  renderPickerSubtitle?: (item: TCatalog) => ReactNode;
  filterCatalogItem?: (item: TCatalog, query: string) => boolean;
  variant?: "collapsible" | "static";
  useLinks: (
    entityId: string,
    options: { enabled: boolean }
  ) => EntityLinksHookResult<TCatalog, TLinked>;
};

/**
 * Cross-app entity links panel (tasks ↔ notes ↔ contacts ↔ links).
 * Apps supply domain hooks, deep links, and formatting.
 */
export function EntityLinksPanel<
  TCatalog extends { id: string },
  TLinked extends EntityLinkRow,
>({
  entityId,
  labels,
  sectionIcon,
  pickerItemIcon,
  getDeepLink,
  formatName,
  renderLinkedSubtitle,
  renderPickerSubtitle,
  filterCatalogItem,
  variant = "collapsible",
  useLinks,
}: EntityLinksPanelProps<TCatalog, TLinked>): React.JSX.Element {
  const SectionGlyph = sectionIcon;
  const PickerGlyph = pickerItemIcon;
  const [isOpen, setIsOpen] = useState(variant === "static");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const dataEnabled = variant === "static" || isOpen || isPickerOpen;
  const { allItems, linkedItems, isLoading, link, unlink } = useLinks(
    entityId,
    {
      enabled: dataEnabled,
    }
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const [unlinkTarget, setUnlinkTarget] = useState<{
    linkId: string;
    name: string;
  } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const linkedIds = useMemo(
    () => new Set(linkedItems.map((item) => item.id)),
    [linkedItems]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (linkedIds.has(item.id)) return false;
      if (!query) return true;
      if (filterCatalogItem) return filterCatalogItem(item, query);
      return formatName(item).toLowerCase().includes(query);
    });
  }, [allItems, filterCatalogItem, formatName, linkedIds, searchQuery]);

  const handleLink = useCallback(
    async (targetId: string) => {
      setIsLinking(true);
      try {
        const success = await link(targetId);
        if (success) {
          setSearchQuery("");
          setIsPickerOpen(false);
        }
      } finally {
        setIsLinking(false);
      }
    },
    [link]
  );

  const handleUnlinkClick = useCallback((linkId: string, name: string) => {
    setUnlinkTarget({ linkId, name });
  }, []);

  const handleUnlinkConfirm = useCallback(async () => {
    if (!unlinkTarget) return;
    setIsUnlinking(true);
    try {
      await unlink(unlinkTarget.linkId);
    } finally {
      setIsUnlinking(false);
      setUnlinkTarget(null);
    }
  }, [unlink, unlinkTarget]);

  const picker = (
    <Popover
      open={isPickerOpen}
      onOpenChange={(open) => {
        setIsPickerOpen(open);
        if (!open) setSearchQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" />
        }
      >
        <PlusIcon className="size-3.5" />
        Add
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0" initialFocus={false}>
        <div className="flex flex-col overflow-hidden">
          <div className="border-b px-3 py-2">
            <Input
              placeholder={labels.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label={labels.searchPlaceholder}
            />
          </div>
          <ScrollArea className="max-h-64">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {allItems.length === 0
                  ? labels.emptyCatalog
                  : searchQuery
                    ? labels.emptySearch
                    : labels.allLinked}
              </p>
            ) : (
              <div className="p-1">
                {filteredItems.map((item) => {
                  const name = formatName(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isLinking}
                      onClick={() => handleLink(item.id)}
                      className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden disabled:pointer-events-none disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        {renderPickerSubtitle?.(item)}
                      </div>
                      <PickerGlyph className="size-3.5 shrink-0 text-amber-500" />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );

  const linkedList = (
    <>
      {isLoading && linkedItems.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      {linkedItems.length > 0 && (
        <div className="space-y-1.5">
          {linkedItems.map((item) => {
            const name = formatName(item);
            return (
              <a
                key={item.link_id}
                href={getDeepLink(item.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <PickerGlyph className="size-3.5 shrink-0 text-amber-500" />
                  </div>
                  {renderLinkedSubtitle?.(item)}
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnlinkClick(item.link_id, name);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <UnlinkIcon className="size-3.5" />
                  </Button>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {!isLoading && linkedItems.length === 0 && (
        <p className="text-muted-foreground py-2 text-center text-xs">
          {labels.noLinkedYet}
        </p>
      )}
    </>
  );

  const sectionHeader = (
    <div className="flex items-center justify-between">
      {variant === "collapsible" ? (
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 text-left"
            />
          }
        >
          <SectionGlyph className="text-muted-foreground size-4" />
          <h3 className="text-muted-foreground text-sm font-medium">
            {labels.sectionTitle}
          </h3>
          {linkedItems.length > 0 && (
            <span className="text-muted-foreground text-xs">
              ({linkedItems.length})
            </span>
          )}
        </CollapsibleTrigger>
      ) : (
        <div className="flex items-center gap-2">
          <SectionGlyph className="text-muted-foreground size-4" />
          <h3 className="text-muted-foreground text-sm font-medium">
            {labels.sectionTitle}
          </h3>
          {linkedItems.length > 0 && (
            <span className="text-muted-foreground text-xs">
              ({linkedItems.length})
            </span>
          )}
        </div>
      )}
      {picker}
    </div>
  );

  return (
    <>
      <div className="space-y-3">
        {variant === "collapsible" ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {sectionHeader}
            <CollapsibleContent className="space-y-3">
              {linkedList}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            {sectionHeader}
            <div className="space-y-3">{linkedList}</div>
          </>
        )}
      </div>

      <AlertDialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.unlinkTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {unlinkTarget
                ? labels.unlinkDescription(unlinkTarget.name)
                : null}
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
