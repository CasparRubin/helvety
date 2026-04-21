"use client";

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
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import {
  parseRichTextContent,
  serializeRichTextContent,
} from "@helvety/ui/tiptap-utils";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

const TiptapEditor = dynamic(
  () => import("@helvety/ui/tiptap-editor").then((m) => m.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border-border/40 flex min-h-[200px] items-center justify-center rounded-md border">
        <Loader2Icon className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    ),
  }
);

import { ContactActionPanel } from "@/components/contact-action-panel";
import { ContactEditorCommandBar } from "@/components/contact-editor-command-bar";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { NoteLinksPanel } from "@/components/note-links-panel";
import { TaskLinksPanel } from "@/components/task-links-panel";
import { DatePicker } from "@/components/ui/date-picker";
import { useContact } from "@/hooks/use-contacts";
import { DEFAULT_CATEGORIES } from "@/lib/config/default-categories";

import type { ContactRow } from "@/lib/types";
import type { TiptapEditorRef } from "@helvety/ui/tiptap-editor";
import type { JSONContent } from "@tiptap/react";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for ContactEditor */
interface ContactEditorProps {
  contactId: string;
  /** Server-prefetched encrypted contact to skip initial round-trip */
  initialEncryptedContact?: ContactRow;
  embedded?: boolean;
  onClose?: () => void;
}

/**
 * ContactEditor - Full editor for a single contact.
 * Uses two-column responsive layout for full-page mode and a stacked layout for sheet mode.
 */
export function ContactEditor({
  contactId,
  initialEncryptedContact,
  embedded = false,
  onClose,
}: ContactEditorProps) {
  const router = useRouter();
  const { contact, isLoading, error, refresh, update, remove } = useContact(
    contactId,
    { initialEncryptedData: initialEncryptedContact }
  );

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState<JSONContent | null>(null);
  const editorRef = useRef<TiptapEditorRef>(null);

  // Save tracking
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const savedFirstNameRef = useRef("");
  const savedLastNameRef = useRef("");
  const savedDescriptionRef = useRef("");
  const savedEmailRef = useRef("");
  const savedPhoneRef = useRef("");
  const savedBirthdayRef = useRef<string | null>(null);
  const savedNotesRef = useRef<string | null>(null);
  const [editorBaselineCaptured, setEditorBaselineCaptured] = useState(false);
  /** Captures the editor's normalized output on its first emission (initialization).
   * Until captured, notes changes are not treated as user edits. */
  const notesBaselineCaptured = useRef(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Unsaved changes confirmation state
  const [pendingAction, setPendingAction] = useState<"back" | "refresh" | null>(
    null
  );

  // Populate form when contact loads
  useEffect(() => {
    if (contact && !editorBaselineCaptured) {
      setFirstName(contact.first_name);
      setLastName(contact.last_name);
      setDescription(contact.description ?? "");
      setEmail(contact.email ?? "");
      setPhone(contact.phone ?? "");
      setBirthday(contact.birthday);
      const parsedNotes = parseRichTextContent(contact.notes);
      setNotesContent(parsedNotes);
      savedFirstNameRef.current = contact.first_name;
      savedLastNameRef.current = contact.last_name;
      savedDescriptionRef.current = contact.description ?? "";
      savedEmailRef.current = contact.email ?? "";
      savedPhoneRef.current = contact.phone ?? "";
      savedBirthdayRef.current = contact.birthday;
      savedNotesRef.current = contact.notes;
      notesBaselineCaptured.current = false;
      setEditorBaselineCaptured(true);
    }
  }, [contact, editorBaselineCaptured]);

  // Derive unsaved-changes flag during render instead of in a useEffect
  const hasUnsavedChanges = useMemo(() => {
    if (!editorBaselineCaptured) return false;

    const currentNotes = notesContent
      ? serializeRichTextContent(notesContent)
      : null;

    return (
      firstName !== savedFirstNameRef.current ||
      lastName !== savedLastNameRef.current ||
      description !== savedDescriptionRef.current ||
      email !== savedEmailRef.current ||
      phone !== savedPhoneRef.current ||
      birthday !== savedBirthdayRef.current ||
      currentNotes !== savedNotesRef.current
    );
  }, [
    editorBaselineCaptured,
    firstName,
    lastName,
    description,
    email,
    phone,
    birthday,
    notesContent,
  ]);

  const handleSave = useCallback(async () => {
    if (!contact || isSaving) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const currentNotes = notesContent
        ? serializeRichTextContent(notesContent)
        : null;

      const success = await update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        description: description.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        birthday,
        notes: currentNotes,
      });

      if (success) {
        savedFirstNameRef.current = firstName.trim();
        savedLastNameRef.current = lastName.trim();
        savedDescriptionRef.current = description.trim();
        savedEmailRef.current = email.trim();
        savedPhoneRef.current = phone.trim();
        savedBirthdayRef.current = birthday;
        savedNotesRef.current = currentNotes;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [
    contact,
    firstName,
    lastName,
    description,
    email,
    phone,
    birthday,
    notesContent,
    update,
    isSaving,
  ]);

  const doBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.replace("/");
  }, [onClose, router]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("back");
      return;
    }
    doBack();
  }, [hasUnsavedChanges, doBack]);

  const handleRefresh = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("refresh");
      return;
    }
    setIsRefreshing(true);
    setEditorBaselineCaptured(false);
    notesBaselineCaptured.current = false;
    void (async () => {
      try {
        await refresh();
      } finally {
        setIsRefreshing(false);
      }
    })();
  }, [refresh, hasUnsavedChanges]);

  const handleConfirmDiscard = useCallback(async () => {
    const action = pendingAction;
    setPendingAction(null);

    if (action === "back") {
      doBack();
    } else if (action === "refresh") {
      setIsRefreshing(true);
      setEditorBaselineCaptured(false);
      notesBaselineCaptured.current = false;
      try {
        await refresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [pendingAction, doBack, refresh]);

  const handleDelete = useCallback(() => {
    setIsDeleteOpen(true);
  }, []);

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      if (!contact || categoryId === contact.category_id) return;
      setIsSavingCategory(true);
      try {
        await update({ category_id: categoryId });
      } finally {
        setIsSavingCategory(false);
      }
    },
    [contact, update]
  );

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeletingContact(true);
    try {
      const success = await remove();
      if (success) {
        if (onClose) {
          onClose();
        } else {
          router.replace("/");
        }
      }
    } finally {
      setIsDeletingContact(false);
      setIsDeleteOpen(false);
    }
  }, [onClose, remove, router]);

  // Handle notes change: capture editor baseline on first emission, then compare values
  const handleNotesChange = useCallback((content: JSONContent) => {
    const serialized = serializeRichTextContent(content);

    // On the first emission after mount/refresh, capture the editor's normalized
    // output as the baseline. This accounts for any content normalization TiptapEditor
    // performs on the initial content (e.g., adding empty paragraphs, restructuring).
    if (!notesBaselineCaptured.current) {
      savedNotesRef.current = serialized;
      notesBaselineCaptured.current = true;
      return;
    }

    setNotesContent(content);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  // Error state - friendly UI with retry (toast already shown by hooks)
  if (error || !contact) {
    return (
      <>
        <ContactEditorCommandBar
          onBack={handleBack}
          showBack={!embedded}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-muted-foreground text-sm">
              {error
                ? "Couldn't load this contact. Please try again."
                : "Contact not found"}
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ContactEditorCommandBar
        onBack={handleBack}
        showBack={!embedded}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        saveStatus={saveStatus}
        onDelete={handleDelete}
      />

      <div className="container mx-auto px-4 py-8">
        <div
          className={
            embedded
              ? "flex flex-col gap-6"
              : "flex flex-col-reverse gap-6 md:flex-row md:gap-8"
          }
        >
          {/* Left column: Form fields + Notes editor */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Name fields */}
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

            {/* Description field */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cousin, Product Manager"
              />
            </div>

            {/* Email and Phone fields */}
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

            {/* Birthday field */}
            <div className="grid gap-2">
              <Label>Birthday</Label>
              <DatePicker
                value={birthday}
                onChange={setBirthday}
                placeholder="Pick a birthday"
              />
            </div>

            {/* Notes TipTap Editor */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              {editorBaselineCaptured ? (
                <TiptapEditor
                  ref={editorRef}
                  content={notesContent}
                  onChange={handleNotesChange}
                  placeholder="Add notes about this contact..."
                />
              ) : (
                <div className="border-border/40 bg-background dark:bg-input/30 min-h-[200px] rounded-md border" />
              )}
            </div>

            {!embedded && (
              <div className="space-y-6">
                <TaskLinksPanel contactId={contactId} />
                <NoteLinksPanel contactId={contactId} />
              </div>
            )}
          </div>

          {/* Right column: Action panel */}
          <ContactActionPanel
            contact={contact}
            categories={DEFAULT_CATEGORIES}
            onCategoryChange={(categoryId) => {
              void handleCategoryChange(categoryId);
            }}
            isSavingCategory={isSavingCategory}
            stacked={embedded}
          />

          {embedded && (
            <div className="space-y-6">
              <TaskLinksPanel contactId={contactId} />
              <NoteLinksPanel contactId={contactId} />
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost. Are you sure you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDiscard}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Contact Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        entityType="contact"
        entityName={`${contact.first_name} ${contact.last_name}`}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeletingContact}
      />
    </>
  );
}
