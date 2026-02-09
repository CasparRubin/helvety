"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { CategoryConfiguratorContent } from "@/components/category-configurator";
import { ContactCommandBar } from "@/components/contact-command-bar";
import { ContactList } from "@/components/contact-list";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { SettingsPanel } from "@/components/settings-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useContacts,
  useCategoryConfigs,
  useCategories,
  useCategoryAssignment,
} from "@/hooks";

/**
 * ContactsDashboard - Main dashboard showing all contacts
 */
export function ContactsDashboard() {
  const router = useRouter();
  const { contacts, isLoading, error, refresh, create, remove, reorder } =
    useContacts();
  const {
    configs,
    create: createConfig,
    remove: removeConfig,
    update: updateConfig,
  } = useCategoryConfigs();
  const {
    effectiveConfigId,
    assign: assignCategory,
    unassign: unassignCategory,
  } = useCategoryAssignment();
  const { categories } = useCategories(effectiveConfigId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get the first category as default for new contacts
  const defaultCategoryId =
    categories.length > 0
      ? categories.reduce(
          (min, c) => (c.sort_order < min.sort_order ? c : min),
          categories[0]!
        ).id
      : null;

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFirstName.trim() || !newLastName.trim()) return;

      setIsCreating(true);
      try {
        const result = await create({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          email: newEmail.trim() || null,
          notes: null,
          category_id: defaultCategoryId,
        });

        if (result) {
          setNewFirstName("");
          setNewLastName("");
          setNewEmail("");
          setIsCreateOpen(false);
        }
      } finally {
        setIsCreating(false);
      }
    },
    [newFirstName, newLastName, newEmail, create, defaultCategoryId]
  );

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState.id) return;
    setIsDeleting(true);
    try {
      await remove(deleteState.id);
      setDeleteState({ open: false, id: null, name: null });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteState.id, remove]);

  const handleContactClick = useCallback(
    (contact: { id: string }) => {
      router.push(`/contacts/${contact.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  return (
    <>
      <ContactCommandBar
        onCreateClick={() => setIsCreateOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onSettings={() => setIsSettingsOpen(true)}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Contacts</h1>

        <ContactList
          contacts={contacts}
          isLoading={isLoading}
          error={error}
          categories={categories}
          onContactClick={handleContactClick}
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
                Create a new contact. All data is encrypted end-to-end.
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
                <Label htmlFor="contact-last-name">Last Name</Label>
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

      {/* Settings Panel */}
      <SettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        sections={[
          {
            id: "categories",
            label: "Categories",
            content: (
              <CategoryConfiguratorContent
                configs={configs}
                assignedConfigId={effectiveConfigId}
                onCreateConfig={async (name) => createConfig({ name })}
                onDeleteConfig={removeConfig}
                onUpdateConfig={async (id, name) => updateConfig(id, { name })}
                onAssignConfig={assignCategory}
                onUnassignConfig={unassignCategory}
              />
            ),
          },
        ]}
      />

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
