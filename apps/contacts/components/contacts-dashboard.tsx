"use client";

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
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";

import { ContactCommandBar } from "@/components/contact-command-bar";
import { ContactList } from "@/components/contact-list";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useCategories } from "@/hooks/use-categories";
import { useContacts } from "@/hooks/use-contacts";
import { DEFAULT_CATEGORY_CONFIG } from "@/lib/config/default-categories";
import { ERROR_MESSAGES, TOAST_DURATIONS } from "@/lib/constants";
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
  const router = useRouter();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const { contacts, isLoading, error, refresh, create, remove, reorder } =
    useContacts({ initialEncryptedData: initialEncryptedContacts });
  const { categories } = useCategories(DEFAULT_CATEGORY_CONFIG.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();

  // Get the first category as default for new contacts
  const defaultCategoryId =
    categories.length > 0
      ? categories.reduce(
          (min, c) => (c.sort_order < min.sort_order ? c : min),
          categories[0]!
        ).id
      : null;

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
          category_id: defaultCategoryId,
        });

        if (result) {
          setNewFirstName("");
          setNewLastName("");
          setNewEmail("");
          setIsCreateOpen(false);
        }
      });
    },
    [
      newFirstName,
      newLastName,
      newEmail,
      create,
      defaultCategoryId,
      startCreateTransition,
    ]
  );

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteState.id) return;
    startDeleteTransition(async () => {
      await remove(deleteState.id!);
      setDeleteState({ open: false, id: null, name: null });
    });
  }, [deleteState.id, remove, startDeleteTransition]);

  const handleContactClick = useCallback(
    (contact: { id: string }) => {
      router.push(`/contacts/${contact.id}`);
    },
    [router]
  );

  const handleContactPrefetch = useCallback(
    (contact: { id: string }) => {
      void router.prefetch(`/contacts/${contact.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh, startRefreshTransition]);

  /** Export decrypted contact data as JSON (supports nDSG Art. 28 data portability) */
  const handleExportData = useCallback(() => {
    if (!masterKey) return;
    startExportTransition(async () => {
      try {
        await downloadContactDataExport(masterKey);
      } catch (error) {
        logger.error("Data export failed:", error);
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
        isRefreshing={isRefreshing}
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Contacts</h1>

        <ContactList
          contacts={contacts}
          isLoading={isLoading}
          error={error}
          categories={categories}
          onContactClick={handleContactClick}
          onContactPrefetch={handleContactPrefetch}
          onContactDelete={handleDeleteClick}
          onReorder={reorder}
        />
      </div>

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
