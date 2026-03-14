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
  FileTextIcon,
  Loader2Icon,
  NotebookPenIcon,
  PlusIcon,
  UnlinkIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useNoteLinks } from "@/hooks/use-note-links";

import type { LinkedNote } from "@/hooks/use-note-links";

type Note = { id: string; title: string };

const NOTES_APP_URL = urls.notes;

export function getNoteDeepLink(noteId: string): string {
  const params = new URLSearchParams({ note: noteId });
  return `${NOTES_APP_URL}?${params.toString()}`;
}

function formatNoteName(note: Note | LinkedNote): string {
  return note.title;
}

function LinkedNoteRow({
  note,
  onUnlink,
}: {
  note: LinkedNote;
  onUnlink: (linkId: string, name: string) => void;
}): React.JSX.Element {
  const name = formatNoteName(note);

  return (
    <a
      href={getNoteDeepLink(note.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          <FileTextIcon className="size-3.5 shrink-0 text-amber-500" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUnlink(note.link_id, name);
          }}
          className="text-destructive hover:text-destructive"
        >
          <UnlinkIcon className="size-3.5" />
        </Button>
      </div>
    </a>
  );
}

export function NoteLinksPanel({
  itemId,
}: {
  itemId: string;
}): React.JSX.Element {
  const { allNotes, linkedNotes, isLoading, link, unlink } =
    useNoteLinks(itemId);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const [unlinkTarget, setUnlinkTarget] = useState<{
    linkId: string;
    name: string;
  } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const linkedNoteIds = useMemo(
    () => new Set(linkedNotes.map((c) => c.id)),
    [linkedNotes]
  );

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allNotes.filter((c) => {
      if (linkedNoteIds.has(c.id)) return false;
      if (!query) return true;
      const name = formatNoteName(c).toLowerCase();
      return name.includes(query);
    });
  }, [allNotes, linkedNoteIds, searchQuery]);

  const handleLink = useCallback(
    async (noteId: string) => {
      setIsLinking(true);
      try {
        const success = await link(noteId);
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
            {linkedNotes.length > 0 && (
              <span className="text-muted-foreground text-xs">
                ({linkedNotes.length})
              </span>
            )}
          </div>

          <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
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
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <CommandEmpty>
                      {allNotes.length === 0
                        ? "No notes found"
                        : searchQuery
                          ? "No matching notes"
                          : "All notes are already linked"}
                    </CommandEmpty>
                  ) : (
                    filteredNotes.map((note) => {
                      const name = formatNoteName(note);
                      return (
                        <CommandItem
                          key={note.id}
                          value={note.id}
                          onSelect={() => handleLink(note.id)}
                          disabled={isLinking}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{name}</p>
                          </div>
                          <FileTextIcon className="size-3.5 shrink-0 text-amber-500" />
                        </CommandItem>
                      );
                    })
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {isLoading && linkedNotes.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}

        {linkedNotes.length > 0 && (
          <div className="space-y-1.5">
            {linkedNotes.map((note) => (
              <LinkedNoteRow
                key={note.link_id}
                note={note}
                onUnlink={handleUnlinkClick}
              />
            ))}
          </div>
        )}

        {!isLoading && linkedNotes.length === 0 && (
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
              Are you sure you want to unlink &ldquo;{unlinkTarget?.name}&rdquo;
              from this item? The note itself will not be deleted.
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
