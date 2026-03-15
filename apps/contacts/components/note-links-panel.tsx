"use client";
/* eslint-disable jsdoc/require-jsdoc */

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
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  NotebookPenIcon,
  PlusIcon,
  UnlinkIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useNoteLinks } from "@/hooks/use-note-links";

import type { LinkedNote, PickerNote } from "@/hooks/use-note-links";

const NOTES_APP_URL = urls.notes;

export function getNoteDeepLink(noteId: string): string {
  const params = new URLSearchParams({ note: noteId });
  return `${NOTES_APP_URL}?${params.toString()}`;
}

function NoteRow({
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
      <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
        <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0" />
      </div>
    </a>
  );
}

export function NoteLinksPanel({
  contactId,
}: {
  contactId: string;
}): React.JSX.Element {
  const {
    notes,
    totalCount,
    allEntities,
    isLoading,
    isLoadingEntities,
    error,
    refresh,
    loadEntities,
    link,
    unlink,
  } = useNoteLinks(contactId);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{
    linkId: string;
    title: string;
  } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const linkedNoteIds = useMemo(() => new Set(notes.map((n) => n.id)), [notes]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allEntities.notes
      .filter((note) => !linkedNoteIds.has(note.id))
      .filter((note) => !query || note.title.toLowerCase().includes(query));
  }, [allEntities.notes, linkedNoteIds, searchQuery]);

  const allAvailableTotal = useMemo(
    () =>
      allEntities.notes.filter((note) => !linkedNoteIds.has(note.id)).length,
    [allEntities.notes, linkedNoteIds]
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
    async (noteId: string) => {
      setIsLinking(true);
      try {
        const success = await link(noteId);
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
            <NotebookPenIcon className="text-muted-foreground size-4" />
            <h3 className="text-muted-foreground text-sm font-medium">
              Linked Notes
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
                  placeholder="Search notes..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isLoadingEntities ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <CommandEmpty>
                      {allEntities.notes.length === 0
                        ? "No notes found"
                        : searchQuery
                          ? "No matching notes"
                          : allAvailableTotal === 0
                            ? "All notes are already linked"
                            : "No notes available"}
                    </CommandEmpty>
                  ) : (
                    filteredNotes.map((note: PickerNote) => (
                      <CommandItem
                        key={note.id}
                        value={note.id}
                        onSelect={() => handleLink(note.id)}
                        disabled={isLinking}
                      >
                        <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {note.title}
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
              Could not load linked notes. Please retry.
            </p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        )}

        {notes.length > 0 && (
          <div className="space-y-1.5">
            {notes.map((note: LinkedNote) => (
              <NoteRow
                key={note.link_id}
                title={note.title}
                href={getNoteDeepLink(note.id)}
                onUnlink={() =>
                  setUnlinkTarget({ linkId: note.link_id, title: note.title })
                }
              />
            ))}
          </div>
        )}

        {!isLoading && totalCount === 0 && (
          <p className="text-muted-foreground py-2 text-center text-xs">
            No notes linked yet
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
            <AlertDialogTitle>Unlink Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink &ldquo;{unlinkTarget?.title}
              &rdquo; from this contact? The note itself will not be deleted.
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
