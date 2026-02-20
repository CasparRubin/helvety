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
  Loader2Icon,
  NotepadTextIcon,
  PlusIcon,
  UnlinkIcon,
  UsersIcon,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";

import { useContactLinks } from "@/hooks";

import type { LinkedContact } from "@/hooks";
import type { EntityType, Contact } from "@/lib/types";

// =============================================================================
// Helpers
// =============================================================================

const CONTACTS_APP_URL = urls.contacts;

/** Build a deep link URL to view/edit a contact in the Contacts app */
function getContactDeepLink(contactId: string): string {
  return `${CONTACTS_APP_URL}/contacts/${contactId}`;
}

/** Format a contact's full name */
function formatContactName(contact: Contact | LinkedContact): string {
  return `${contact.first_name} ${contact.last_name}`.trim();
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * A single linked contact row rendered as a clickable link to the Contacts app.
 */
function LinkedContactRow({
  contact,
  onUnlink,
}: {
  contact: LinkedContact;
  onUnlink: (linkId: string, name: string) => void;
}): React.JSX.Element {
  const name = formatContactName(contact);

  return (
    <a
      href={getContactDeepLink(contact.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      {/* Contact info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          {contact.has_notes && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NotepadTextIcon className="size-3.5 shrink-0 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Has notes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {contact.email && (
          <p className="text-muted-foreground truncate text-xs">
            {contact.email}
          </p>
        )}
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
                  onUnlink(contact.link_id, name);
                }}
                className="text-destructive hover:text-destructive"
              >
                <UnlinkIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Unlink contact</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </a>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Panel for linking/unlinking contacts to a task entity (unit, space, or item).
 * Displays linked contacts with deep links to the Contacts app and a
 * searchable picker to add new contacts.
 */
export function ContactLinksPanel({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}): React.JSX.Element {
  const { allContacts, linkedContacts, isLoading, link, unlink } =
    useContactLinks(entityType, entityId);

  // Picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Unlink confirmation state
  const [unlinkTarget, setUnlinkTarget] = useState<{
    linkId: string;
    name: string;
  } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Filter contacts: exclude already-linked ones and apply search
  const linkedContactIds = useMemo(
    () => new Set(linkedContacts.map((c) => c.id)),
    [linkedContacts]
  );

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allContacts.filter((c) => {
      if (linkedContactIds.has(c.id)) return false;
      if (!query) return true;
      const name = formatContactName(c).toLowerCase();
      const email = c.email?.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [allContacts, linkedContactIds, searchQuery]);

  // Handle linking a contact
  const handleLink = useCallback(
    async (contactId: string) => {
      setIsLinking(true);
      try {
        const success = await link(contactId);
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

  // Handle unlink confirmation
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
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="text-muted-foreground size-4" />
            <h3 className="text-muted-foreground text-sm font-medium">
              Contacts
            </h3>
            {linkedContacts.length > 0 && (
              <span className="text-muted-foreground text-xs">
                ({linkedContacts.length})
              </span>
            )}
          </div>

          {/* Add contact button / picker */}
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
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <CommandEmpty>
                      {allContacts.length === 0
                        ? "No contacts found"
                        : searchQuery
                          ? "No matching contacts"
                          : "All contacts are already linked"}
                    </CommandEmpty>
                  ) : (
                    filteredContacts.map((contact) => {
                      const name = formatContactName(contact);
                      return (
                        <CommandItem
                          key={contact.id}
                          value={contact.id}
                          onSelect={() => handleLink(contact.id)}
                          disabled={isLinking}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{name}</p>
                            {contact.email && (
                              <p className="text-muted-foreground truncate text-xs">
                                {contact.email}
                              </p>
                            )}
                          </div>
                          {contact.has_notes && (
                            <NotepadTextIcon className="size-3.5 shrink-0 text-amber-500" />
                          )}
                        </CommandItem>
                      );
                    })
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Loading state */}
        {isLoading && linkedContacts.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}

        {/* Linked contacts list */}
        {linkedContacts.length > 0 && (
          <div className="space-y-1.5">
            {linkedContacts.map((contact) => (
              <LinkedContactRow
                key={contact.link_id}
                contact={contact}
                onUnlink={handleUnlinkClick}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && linkedContacts.length === 0 && (
          <p className="text-muted-foreground py-2 text-center text-xs">
            No contacts linked yet
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
            <AlertDialogTitle>Unlink Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink &ldquo;{unlinkTarget?.name}
              &rdquo; from this {entityType}? The contact itself will not be
              deleted.
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
