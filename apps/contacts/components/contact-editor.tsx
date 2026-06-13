"use client";

import { DatePicker } from "@helvety/ui/date-picker";
import { E2eeRichTextItemEditorShell } from "@helvety/ui/e2ee-item-editor-shell";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import {
  serializeRichTextContent,
  type JSONContent,
} from "@helvety/ui/tiptap-utils";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { ContactActionPanel } from "@/components/contact-action-panel";
import { ContactEditorCommandBar } from "@/components/contact-editor-command-bar";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useContact } from "@/hooks/use-contacts";
import { DEFAULT_CATEGORIES } from "@/lib/config/default-categories";

import type { Contact, ContactRow } from "@/lib/types";

const NoteLinksPanel = dynamic(
  () => import("@/components/note-links-panel").then((m) => m.NoteLinksPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

const TaskLinksPanel = dynamic(
  () => import("@/components/task-links-panel").then((m) => m.TaskLinksPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    ),
  }
);

const APP_HOME_PATH = "/contacts";

/** Saved contact metadata snapshot for dirty tracking outside the rich-text shell. */
interface ContactMetadataSnapshot {
  firstName: string;
  lastName: string;
  description: string;
  email: string;
  phone: string;
  birthday: string | null;
}

/** Props for ContactEditor */
interface ContactEditorProps {
  contactId: string;
  /** Already decrypted contact to skip initial fetch/decrypt */
  initialContact?: Contact;
  /** Server-prefetched encrypted contact to skip initial round-trip */
  initialEncryptedContact?: ContactRow;
  onClose?: () => void;
  onLocalPatch?: (id: string, input: { category_id?: string }) => void;
}

/** Contact editor for a single contact inside the dashboard detail sheet. */
export function ContactEditor({
  contactId,
  initialContact,
  initialEncryptedContact,
  onClose,
  onLocalPatch,
}: ContactEditorProps) {
  const router = useRouter();
  const { contact, isLoading, error, refresh, update, remove } = useContact(
    contactId,
    {
      initialData: initialContact,
      initialEncryptedData: initialEncryptedContact,
    }
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const savedMetadataRef = useRef<ContactMetadataSnapshot>({
    firstName: "",
    lastName: "",
    description: "",
    email: "",
    phone: "",
    birthday: null,
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (contact && !hasInitialized) {
      setFirstName(contact.first_name);
      setLastName(contact.last_name);
      setDescription(contact.description ?? "");
      setEmail(contact.email ?? "");
      setPhone(contact.phone ?? "");
      setBirthday(contact.birthday);
      savedMetadataRef.current = {
        firstName: contact.first_name,
        lastName: contact.last_name,
        description: contact.description ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        birthday: contact.birthday,
      };
      setHasInitialized(true);
    }
  }, [contact, hasInitialized]);

  const hasAdditionalUnsavedChanges = useMemo(() => {
    if (!hasInitialized) return false;

    const saved = savedMetadataRef.current;
    return (
      firstName !== saved.firstName ||
      lastName !== saved.lastName ||
      description !== saved.description ||
      email !== saved.email ||
      phone !== saved.phone ||
      birthday !== saved.birthday
    );
  }, [
    hasInitialized,
    firstName,
    lastName,
    description,
    email,
    phone,
    birthday,
  ]);

  const onSave = useCallback(
    async (_title: string, notesContent: JSONContent | null) => {
      if (!contact) return false;

      const notes = notesContent
        ? serializeRichTextContent(notesContent)
        : null;

      const trimmedDescription = description.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      const success = await update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        description: trimmedDescription === "" ? null : trimmedDescription,
        email: trimmedEmail === "" ? null : trimmedEmail,
        phone: trimmedPhone === "" ? null : trimmedPhone,
        birthday,
        notes,
      });

      if (success) {
        savedMetadataRef.current = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          description: trimmedDescription,
          email: trimmedEmail,
          phone: trimmedPhone,
          birthday,
        };
      }

      return success;
    },
    [contact, firstName, lastName, description, email, phone, birthday, update]
  );

  const doBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.replace(APP_HOME_PATH);
  }, [onClose, router]);

  const handleEditorRefresh = useCallback(async () => {
    setHasInitialized(false);
    await refresh();
  }, [refresh]);

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      if (!contact || categoryId === contact.category_id) return;
      const previousCategoryId = contact.category_id;
      onLocalPatch?.(contact.id, { category_id: categoryId });
      setIsSavingCategory(true);
      try {
        const success = await update({ category_id: categoryId });
        if (!success) {
          onLocalPatch?.(contact.id, { category_id: previousCategoryId });
        }
      } finally {
        setIsSavingCategory(false);
      }
    },
    [contact, onLocalPatch, update]
  );

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeletingContact(true);
    try {
      const success = await remove();
      if (success) {
        if (onClose) {
          onClose();
        } else {
          router.replace(APP_HOME_PATH);
        }
      }
    } finally {
      setIsDeletingContact(false);
      setIsDeleteOpen(false);
    }
  }, [onClose, remove, router]);

  if (!contact && !error && isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <E2eeRichTextItemEditorShell
      title=""
      description={contact?.notes ?? null}
      isLoading={isLoading}
      hasItem={Boolean(contact)}
      error={error}
      hasInitialized={hasInitialized}
      onTitleChange={() => undefined}
      onSave={onSave}
      onRefresh={handleEditorRefresh}
      onBack={doBack}
      titlePlaceholder=""
      notFoundMessage="Contact not found"
      loadErrorMessage="Couldn't load this contact. Please try again."
      hideTitle
      requireTitle={false}
      hasAdditionalUnsavedChanges={hasAdditionalUnsavedChanges}
      richTextLabel="Notes"
      richTextPlaceholder="Add notes about this contact..."
      onDeleteRequested={() => setIsDeleteOpen(true)}
      renderCommandBar={(props) => (
        <ContactEditorCommandBar
          onBack={props.onBack}
          showBack={props.showBack}
          onRefresh={props.onRefresh}
          isRefreshing={props.isRefreshing}
          onSave={props.onSave}
          isSaving={props.isSaving}
          hasUnsavedChanges={props.hasUnsavedChanges}
          saveStatus={props.saveStatus}
          onDelete={props.onDelete}
        />
      )}
      renderBeforeEditor={
        contact ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First Name(s)</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name(s)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last Name(s)</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name(s)"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cousin, Product Manager"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Birthday</Label>
              <DatePicker
                value={birthday}
                onChange={setBirthday}
                placeholder="Pick a birthday"
              />
            </div>
          </>
        ) : null
      }
      renderMetadata={
        contact ? (
          <ContactActionPanel
            contact={contact}
            categories={DEFAULT_CATEGORIES}
            onCategoryChange={(categoryId) => {
              void handleCategoryChange(categoryId);
            }}
            isSavingCategory={isSavingCategory}
            stacked
          />
        ) : null
      }
      renderLinks={
        <>
          <TaskLinksPanel contactId={contactId} />
          <NoteLinksPanel contactId={contactId} />
        </>
      }
      deleteDialog={
        contact ? (
          <DeleteConfirmationDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            entityType="contact"
            entityName={`${contact.first_name} ${contact.last_name}`}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeletingContact}
          />
        ) : null
      }
    />
  );
}
