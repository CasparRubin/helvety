"use client";

import { ERROR_MESSAGES, TOAST_DURATIONS } from "@helvety/shared/constants";
import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { logger } from "@helvety/shared/logger";
import { Button } from "@helvety/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { ListSearchField } from "@helvety/ui/list-search-field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ContactCommandBar } from "@/components/contact-command-bar";
import { ContactEditor } from "@/components/contact-editor";
import { ContactList } from "@/components/contact-list";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useContacts } from "@/hooks/use-contacts";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTACT_CATEGORY_ID,
} from "@/lib/config/default-categories";
import { useEncryptionContext } from "@/lib/crypto";
import { downloadContactDataExport } from "@/lib/data-export";

import type { ContactRow } from "@/lib/types";

/** Props for the main contacts dashboard component. */
interface ContactsDashboardProps {
  /** Server-prefetched encrypted contacts to skip initial round-trip */
  initialEncryptedContacts?: ContactRow[];
}

/**
 * ContactsDashboard - Main dashboard showing all contacts
 */
export function ContactsDashboard({
  initialEncryptedContacts,
}: ContactsDashboardProps = {}) {
  const searchParams = useSearchParams();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const {
    contacts,
    isLoading,
    isRefreshing,
    error,
    refresh,
    create,
    remove,
    reorder,
    patchLocal,
  } = useContacts({ initialEncryptedData: initialEncryptedContacts });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(
    DEFAULT_CONTACT_CATEGORY_ID
  );
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    () => searchParams.get("contact")
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    return filterE2eeDashboardItems(contacts, searchQuery, (contact) => [
      contact.first_name,
      contact.last_name,
      contact.email ?? "",
      contact.description ?? "",
      contact.notes ?? "",
    ]);
  }, [contacts, searchQuery]);

  const isSearchActive = searchQuery.trim() !== "";
  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );
  const emptySearchMessage = resolveE2eeEmptySearchMessage({
    searchQuery,
    totalCount: contacts.length,
    filteredCount: filteredContacts.length,
    emptyMessage: "No contacts match your search.",
  });

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFirstName.trim() || !newLastName.trim()) return;

      startCreateTransition(async () => {
        const result = await create({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          description: null,
          email: newEmail.trim() || null,
          phone: null,
          birthday: null,
          notes: null,
          category_id: newCategoryId,
        });

        if (result) {
          setNewFirstName("");
          setNewLastName("");
          setNewEmail("");
          setNewCategoryId(DEFAULT_CONTACT_CATEGORY_ID);
          setIsCreateOpen(false);
        }
      });
    },
    [
      newFirstName,
      newLastName,
      newEmail,
      newCategoryId,
      create,
      startCreateTransition,
    ]
  );

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    const deleteId = deleteState.id;
    if (!deleteId) return;
    startDeleteTransition(async () => {
      await remove(deleteId);
      setDeleteState({ open: false, id: null, name: null });
    });
  }, [deleteState.id, remove, startDeleteTransition]);

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh, startRefreshTransition]);

  /** Export decrypted contact data as JSON. */
  const handleExportData = useCallback(() => {
    if (!masterKey) return;
    startExportTransition(async () => {
      try {
        await downloadContactDataExport(masterKey);
      } catch (error) {
        logger.logUnexpectedError("Data export failed", error);
        toast.error(ERROR_MESSAGES.EXPORT_FAILED, {
          duration: TOAST_DURATIONS.ERROR,
        });
      }
    });
  }, [masterKey, startExportTransition]);

  return (
    <>
      <ContactCommandBar
        onCreateClick={() => setIsCreateOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isRefreshPending}
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Contacts</h1>

        <ListSearchField
          className="mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts…"
          aria-label="Search contacts"
        />

        <ContactList
          contacts={filteredContacts}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          onRetry={refresh}
          onContactClick={(contact) => setSelectedContactId(contact.id)}
          onContactDelete={handleDeleteClick}
          onReorder={isSearchActive ? undefined : reorder}
          categories={DEFAULT_CATEGORIES}
          emptySearchMessage={emptySearchMessage}
        />
      </div>

      <Sheet
        open={selectedContactId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedContactId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-[95vw] 2xl:max-w-[1800px]"
        >
          <SheetHeader>
            <SheetTitle>Contact Details</SheetTitle>
          </SheetHeader>
          {selectedContactId ? (
            <ContactEditor
              contactId={selectedContactId}
              initialContact={selectedContact ?? undefined}
              embedded
              onClose={() => setSelectedContactId(null)}
              onLocalPatch={(id, input) => patchLocal(id, input)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Create Contact Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Contact</DialogTitle>
              <DialogDescription>
                Create a new contact. Sensitive content fields are end-to-end
                encrypted; some structural metadata remains unencrypted for app
                functionality.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="contact-first-name">First Name(s)</Label>
                <Input
                  id="contact-first-name"
                  placeholder="e.g., John"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-last-name">Last Name(s)</Label>
                <Input
                  id="contact-last-name"
                  placeholder="e.g., Doe"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-email">Email (optional)</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="e.g., john@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-category">Category</Label>
                <select
                  id="contact-category"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                >
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isCreating || !newFirstName.trim() || !newLastName.trim()
                }
              >
                {isCreating ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Contact"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, id: null, name: null });
          }
        }}
        entityType="contact"
        entityName={deleteState.name ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
