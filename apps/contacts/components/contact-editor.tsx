"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { emptyContactInput } from "@helvety/shared/e2ee-create-inputs";
import { validateE2eeDraft } from "@helvety/shared/validate-e2ee-draft";
import { DatePicker } from "@helvety/ui/date-picker";
import { E2eeRichTextItemEditorShell } from "@helvety/ui/e2ee-item-editor-shell";
import { FormField } from "@helvety/ui/form-field";
import { Input } from "@helvety/ui/input";
import { toast } from "@helvety/ui/sonner";
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

const EMPTY_CONTACT_CREATE_DEFAULTS = emptyContactInput();

/** Saved contact metadata snapshot for dirty tracking outside the rich-text shell. */
interface ContactMetadataSnapshot {
  firstName: string;
  lastName: string;
  description: string;
  email: string;
  phone: string;
  birthday: string | null;
  categoryId: string;
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

  const [firstName, setFirstName] = useState(() =>
    formMode === "create"
      ? EMPTY_CONTACT_CREATE_DEFAULTS.first_name
      : props.formMode === "edit"
        ? (props.contact?.first_name ?? "")
        : ""
  );
  const [lastName, setLastName] = useState(() =>
    formMode === "create"
      ? EMPTY_CONTACT_CREATE_DEFAULTS.last_name
      : props.formMode === "edit"
        ? (props.contact?.last_name ?? "")
        : ""
  );
  const [description, setDescription] = useState(() =>
    formMode === "create"
      ? ""
      : props.formMode === "edit"
        ? (props.contact?.description ?? "")
        : ""
  );
  const [email, setEmail] = useState(() =>
    formMode === "create"
      ? ""
      : props.formMode === "edit"
        ? (props.contact?.email ?? "")
        : ""
  );
  const [phone, setPhone] = useState(() =>
    formMode === "create"
      ? ""
      : props.formMode === "edit"
        ? (props.contact?.phone ?? "")
        : ""
  );
  const [birthday, setBirthday] = useState<string | null>(() =>
    formMode === "create"
      ? null
      : props.formMode === "edit"
        ? (props.contact?.birthday ?? null)
        : null
  );
  const [categoryId, setCategoryId] = useState(() =>
    formMode === "create"
      ? (EMPTY_CONTACT_CREATE_DEFAULTS.category_id ?? "personal")
      : props.formMode === "edit"
        ? (props.contact?.category_id ?? "personal")
        : "personal"
  );
  const [hasInitialized, setHasInitialized] = useState(
    () =>
      formMode === "create" ||
      (props.formMode === "edit" && props.contact != null)
  );
  const savedMetadataRef = useRef<ContactMetadataSnapshot>({
    firstName:
      formMode === "create"
        ? EMPTY_CONTACT_CREATE_DEFAULTS.first_name
        : props.formMode === "edit"
          ? (props.contact?.first_name ?? "")
          : "",
    lastName:
      formMode === "create"
        ? EMPTY_CONTACT_CREATE_DEFAULTS.last_name
        : props.formMode === "edit"
          ? (props.contact?.last_name ?? "")
          : "",
    description:
      formMode === "create"
        ? ""
        : props.formMode === "edit"
          ? (props.contact?.description ?? "")
          : "",
    email:
      formMode === "create"
        ? ""
        : props.formMode === "edit"
          ? (props.contact?.email ?? "")
          : "",
    phone:
      formMode === "create"
        ? ""
        : props.formMode === "edit"
          ? (props.contact?.phone ?? "")
          : "",
    birthday:
      formMode === "create"
        ? null
        : props.formMode === "edit"
          ? (props.contact?.birthday ?? null)
          : null,
    categoryId:
      formMode === "create"
        ? (EMPTY_CONTACT_CREATE_DEFAULTS.category_id ?? "personal")
        : props.formMode === "edit"
          ? (props.contact?.category_id ?? "personal")
          : "personal",
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const contact = formMode === "edit" ? props.contact : null;
  const contactId = formMode === "edit" ? props.contactId : "create";
  const isLoading = formMode === "edit" ? props.isLoading : false;
  const error = formMode === "edit" ? props.error : null;

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
        categoryId: contact.category_id,
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
      birthday !== saved.birthday ||
      categoryId !== saved.categoryId
    );
  }, [
    hasInitialized,
    firstName,
    lastName,
    description,
    email,
    phone,
    birthday,
    categoryId,
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
      const input = buildContactInput(notesContent);
      const validationError = validateE2eeDraft({
        kind: "contacts",
        value: input,
      });
      if (validationError) {
        toast.error(validationError, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }

      if (formMode === "create") {
        const created = await props.onCreate(input);
        if (created) {
          props.onCreated(created.id);
        }
        return Boolean(created);
      }

      if (!contact) {
        return false;
      }

      const success = await props.onUpdate(input);

      if (success) {
        savedMetadataRef.current = {
          firstName: input.first_name,
          lastName: input.last_name,
          description: input.description ?? "",
          email: input.email ?? "",
          phone: input.phone ?? "",
          birthday: input.birthday ?? null,
          categoryId: input.category_id ?? categoryId,
        };
      }

      return success;
    },
    [buildContactInput, categoryId, contact, formMode, props]
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
        savedMetadataRef.current = {
          ...savedMetadataRef.current,
          categoryId: nextCategoryId,
        };
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
              <FormField label="First Name(s)" id="first-name" required>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name(s)"
                />
              </FormField>
              <FormField label="Last Name(s)" id="last-name">
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name(s)"
                />
              </FormField>
            </div>

            <FormField label="Description" id="description">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cousin, Product Manager"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email" id="email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </FormField>
              <FormField label="Phone" id="phone">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
              </FormField>
            </div>

            <FormField label="Birthday" id="birthday">
              <DatePicker
                value={birthday}
                onChange={setBirthday}
                placeholder="Pick a birthday"
              />
            </FormField>
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
