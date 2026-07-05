"use client";

import { emptyContactInput } from "@helvety/shared/e2ee-create-inputs";
import { DatePicker } from "@helvety/ui/date-picker";
import { E2EE_FORM_FIELD_CLASS } from "@helvety/ui/e2ee-form-layout";
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
import { DEFAULT_CATEGORIES } from "@/lib/config/default-categories";

import type { Contact, ContactInput } from "@/lib/types";

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

const LinkEntityLinksPanel = dynamic(
  () =>
    import("@/components/link-entity-links-panel").then(
      (m) => m.LinkEntityLinksPanel
    ),
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

/** Shared props for contact editor create and edit modes. */
type ContactEditorBaseProps = {
  onClose?: () => void;
};

/** Save-first create mode: inserts on first save via dashboard list hook. */
type ContactEditorCreateProps = ContactEditorBaseProps & {
  formMode: "create";
  onCreate: (input: ContactInput) => Promise<{ id: string } | null>;
  onCreated: (id: string) => void;
};

/** Edit mode: dashboard supplies the resolved contact and list-hook CRUD callbacks. */
type ContactEditorEditProps = ContactEditorBaseProps & {
  formMode: "edit";
  contactId: string;
  contact: Contact | null;
  isLoading?: boolean;
  error?: string | null;
  onUpdate: (input: Partial<ContactInput>) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  onRefresh: () => Promise<void>;
};

/** Props for ContactEditor */
export type ContactEditorProps =
  ContactEditorCreateProps | ContactEditorEditProps;

/** Contact editor for create or edit inside the dashboard detail sheet. */
export function ContactEditor(props: ContactEditorProps) {
  const { formMode, onClose } = props;
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(
    () => emptyContactInput().category_id ?? "personal"
  );
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

  const contact = formMode === "edit" ? props.contact : null;
  const contactId = formMode === "edit" ? props.contactId : "create";
  const isLoading = formMode === "edit" ? props.isLoading : false;
  const error = formMode === "edit" ? props.error : null;

  useEffect(() => {
    if (formMode === "create" && !hasInitialized) {
      const defaults = emptyContactInput();
      setFirstName(defaults.first_name);
      setLastName(defaults.last_name);
      setDescription("");
      setEmail("");
      setPhone("");
      setBirthday(null);
      setCategoryId(defaults.category_id ?? "personal");
      savedMetadataRef.current = {
        firstName: defaults.first_name,
        lastName: defaults.last_name,
        description: "",
        email: "",
        phone: "",
        birthday: null,
      };
      setHasInitialized(true);
    }
  }, [formMode, hasInitialized]);

  useEffect(() => {
    if (formMode === "edit" && contact && !hasInitialized) {
      setFirstName(contact.first_name);
      setLastName(contact.last_name);
      setDescription(contact.description ?? "");
      setEmail(contact.email ?? "");
      setPhone(contact.phone ?? "");
      setBirthday(contact.birthday);
      setCategoryId(contact.category_id);
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
  }, [contact, formMode, hasInitialized]);

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

  const buildContactInput = useCallback(
    (notesContent: JSONContent | null): ContactInput => {
      const notes = notesContent
        ? serializeRichTextContent(notesContent)
        : null;
      const trimmedDescription = description.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      return {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        description: trimmedDescription === "" ? null : trimmedDescription,
        email: trimmedEmail === "" ? null : trimmedEmail,
        phone: trimmedPhone === "" ? null : trimmedPhone,
        birthday,
        notes,
        category_id: categoryId,
      };
    },
    [birthday, categoryId, description, email, firstName, lastName, phone]
  );

  const onSave = useCallback(
    async (_title: string, notesContent: JSONContent | null) => {
      if (!firstName.trim()) {
        return false;
      }

      if (formMode === "create") {
        const created = await props.onCreate(buildContactInput(notesContent));
        if (created) {
          props.onCreated(created.id);
        }
        return Boolean(created);
      }

      if (!contact) {
        return false;
      }

      const input = buildContactInput(notesContent);
      const success = await props.onUpdate(input);

      if (success) {
        savedMetadataRef.current = {
          firstName: input.first_name,
          lastName: input.last_name,
          description: input.description ?? "",
          email: input.email ?? "",
          phone: input.phone ?? "",
          birthday: input.birthday ?? null,
        };
      }

      return success;
    },
    [buildContactInput, contact, firstName, formMode, props]
  );

  const doBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.replace(APP_HOME_PATH);
  }, [onClose, router]);

  const handleEditorRefresh = useCallback(async () => {
    if (formMode !== "edit") {
      return;
    }
    setHasInitialized(false);
    await props.onRefresh();
  }, [formMode, props]);

  const handleCategoryChange = useCallback(
    async (nextCategoryId: string) => {
      if (formMode === "create") {
        setCategoryId(nextCategoryId);
        return;
      }
      if (!contact || nextCategoryId === contact.category_id) {
        return;
      }
      setIsSavingCategory(true);
      try {
        await props.onUpdate({ category_id: nextCategoryId });
        setCategoryId(nextCategoryId);
      } finally {
        setIsSavingCategory(false);
      }
    },
    [contact, formMode, props]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (formMode !== "edit") {
      return;
    }
    setIsDeletingContact(true);
    try {
      const success = await props.onRemove();
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
  }, [formMode, onClose, props, router]);

  const metadataContact: Contact | null =
    formMode === "edit"
      ? contact
      : hasInitialized
        ? ({
            id: "create",
            user_id: "",
            first_name: firstName,
            last_name: lastName,
            description: description || null,
            email: email || null,
            phone: phone || null,
            birthday,
            notes: null,
            category_id: categoryId,
            sort_order: 0,
            created_at: "",
            updated_at: "",
          } satisfies Contact)
        : null;

  if (formMode === "edit" && !contact && !error && isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <E2eeRichTextItemEditorShell
      editorSessionKey={contactId}
      title=""
      initialDescription={contact?.notes ?? null}
      isLoading={Boolean(isLoading)}
      hasItem={formMode === "create" ? hasInitialized : Boolean(contact)}
      error={error ?? null}
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
      onDeleteRequested={
        formMode === "edit" ? () => setIsDeleteOpen(true) : undefined
      }
      renderCommandBar={(commandBarProps) => (
        <ContactEditorCommandBar
          onBack={commandBarProps.onBack}
          showBack={commandBarProps.showBack}
          onRefresh={
            formMode === "edit" ? commandBarProps.onRefresh : undefined
          }
          isRefreshing={commandBarProps.isRefreshing}
          onSave={commandBarProps.onSave}
          isSaving={commandBarProps.isSaving}
          hasUnsavedChanges={commandBarProps.hasUnsavedChanges}
          saveStatus={commandBarProps.saveStatus}
          onDelete={formMode === "edit" ? commandBarProps.onDelete : undefined}
        />
      )}
      renderBeforeEditor={
        hasInitialized ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={E2EE_FORM_FIELD_CLASS}>
                <Label htmlFor="first-name">First Name(s)</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name(s)"
                />
              </div>
              <div className={E2EE_FORM_FIELD_CLASS}>
                <Label htmlFor="last-name">Last Name(s)</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name(s)"
                />
              </div>
            </div>

            <div className={E2EE_FORM_FIELD_CLASS}>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cousin, Product Manager"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={E2EE_FORM_FIELD_CLASS}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className={E2EE_FORM_FIELD_CLASS}>
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

            <div className={E2EE_FORM_FIELD_CLASS}>
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
        metadataContact ? (
          <ContactActionPanel
            contact={metadataContact}
            categories={DEFAULT_CATEGORIES}
            onCategoryChange={(nextCategoryId) => {
              void handleCategoryChange(nextCategoryId);
            }}
            isSavingCategory={isSavingCategory}
            stacked
          />
        ) : null
      }
      renderLinks={
        formMode === "edit" && props.contactId ? (
          <>
            <TaskLinksPanel contactId={props.contactId} />
            <NoteLinksPanel contactId={props.contactId} />
            <LinkEntityLinksPanel contactId={props.contactId} />
          </>
        ) : null
      }
      deleteDialog={
        formMode === "edit" && contact ? (
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
