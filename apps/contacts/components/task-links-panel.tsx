"use client";

import { urls } from "@helvety/shared/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@helvety/ui/alert-dialog";
import { Button } from "@helvety/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@helvety/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@helvety/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@helvety/ui/tooltip";
import {
  BoxIcon,
  ExternalLinkIcon,
  ListChecksIcon,
  Loader2Icon,
  PlusIcon,
  UnlinkIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useTaskLinks } from "@/hooks/use-task-links";

import type { LinkedItem, PickerItem } from "@/lib/types";

const TASKS_APP_URL = urls.tasks;

/** Build a deep link URL to the Tasks app item detail. */
export function getItemDeepLink(itemId: string): string {
  const params = new URLSearchParams({ item: itemId });
  return `${TASKS_APP_URL}?${params.toString()}`;
}

/** Render one linked task item row with unlink action. */
function ItemRow({
  title,
  href,
  onUnlink,
}: {
  title: string;
  href: string;
  onUnlink: () => void;
}): React.JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      <BoxIcon className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
      </div>
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
              <p>Unlink task</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0" />
      </div>
    </a>
  );
}

/** Panel for linking/unlinking task items to a contact. */
export function TaskLinksPanel({
  contactId,
}: {
  contactId: string;
}): React.JSX.Element {
  const {
    items,
    totalCount,
    allEntities,
    isLoading,
    isLoadingEntities,
    error,
    refresh,
    loadEntities,
    link,
    unlink,
  } = useTaskLinks(contactId);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{
    linkId: string;
    title: string;
  } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const linkedItemIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allEntities.items
      .filter((item) => !linkedItemIds.has(item.id))
      .filter((item) => !query || item.title.toLowerCase().includes(query));
  }, [allEntities.items, linkedItemIds, searchQuery]);

  const allAvailableTotal = useMemo(
    () =>
      allEntities.items.filter((item) => !linkedItemIds.has(item.id)).length,
    [allEntities.items, linkedItemIds]
  );

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

  const handleLink = useCallback(
    async (itemId: string) => {
      setIsLinking(true);
      try {
        const success = await link(itemId);
        if (success) setSearchQuery("");
      } finally {
        setIsLinking(false);
      }
    },
    [link]
  );

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

          <Popover open={isPickerOpen} onOpenChange={handlePickerOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <PlusIcon className="size-3.5" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isLoadingEntities ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <CommandEmpty>
                      {allEntities.items.length === 0
                        ? "No tasks found"
                        : searchQuery
                          ? "No matching tasks"
                          : allAvailableTotal === 0
                            ? "All tasks are already linked"
                            : "No tasks available"}
                    </CommandEmpty>
                  ) : (
                    filteredItems.map((item: PickerItem) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleLink(item.id)}
                        disabled={isLinking}
                      >
                        <BoxIcon className="text-muted-foreground size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {item.title}
                        </span>
                      </CommandItem>
                    ))
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {isLoading && totalCount === 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 py-2">
            <p role="alert" className="text-muted-foreground text-xs">
              Something went wrong
            </p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-1.5">
            {items.map((item: LinkedItem) => (
              <ItemRow
                key={item.link_id}
                title={item.title}
                href={getItemDeepLink(item.id)}
                onUnlink={() =>
                  setUnlinkTarget({ linkId: item.link_id, title: item.title })
                }
              />
            ))}
          </div>
        )}

        {!isLoading && totalCount === 0 && (
          <p className="text-muted-foreground py-2 text-center text-xs">
            No tasks linked yet
          </p>
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
            <AlertDialogTitle>Unlink Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink &ldquo;{unlinkTarget?.title}
              &rdquo; from this contact? The task itself will not be deleted.
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
