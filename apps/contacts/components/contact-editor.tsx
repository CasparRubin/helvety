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
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

import { ContactActionPanel } from "@/components/contact-action-panel";
import { ContactEditorCommandBar } from "@/components/contact-editor-command-bar";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { TaskLinksPanel } from "@/components/task-links-panel";
import {
  TiptapEditor,
  parseNotesContent,
  serializeNotesContent,
} from "@/components/tiptap-editor";
import { DatePicker } from "@/components/ui/date-picker";
import { useContact, useCategories, useCategoryAssignment } from "@/hooks";

import type { TiptapEditorRef } from "@/components/tiptap-editor";
import type { JSONContent } from "@tiptap/react";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * ContactEditor - Full editor for a single contact.
 * Two-column layout: left = name fields, description, email, phone, birthday,
 * TipTap notes editor, linked task entities; right = action panel (dates, category).
 * On mobile the action panel is displayed above the form fields (via flex-col-reverse)
 * for consistency with the Tasks app.
 */
export function ContactEditor({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { contact, isLoading, error, refresh, update, remove } =
    useContact(contactId);

  const { effectiveConfigId } = useCategoryAssignment();
  const { categories, isLoading: isLoadingCategories } =
    useCategories(effectiveConfigId);

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
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
      const parsedNotes = parseNotesContent(contact.notes);
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
      setHasUnsavedChanges(false);
    }
  }, [contact, editorBaselineCaptured]);

  // Track unsaved changes
  useEffect(() => {
    if (!editorBaselineCaptured) return;

    const firstNameChanged = firstName !== savedFirstNameRef.current;
    const lastNameChanged = lastName !== savedLastNameRef.current;
    const descriptionChanged = description !== savedDescriptionRef.current;
    const emailChanged = email !== savedEmailRef.current;
    const phoneChanged = phone !== savedPhoneRef.current;
    const birthdayChanged = birthday !== savedBirthdayRef.current;

    const currentNotes = notesContent
      ? serializeNotesContent(notesContent)
      : null;
    const notesChanged = currentNotes !== savedNotesRef.current;

    setHasUnsavedChanges(
      firstNameChanged ||
        lastNameChanged ||
        descriptionChanged ||
        emailChanged ||
        phoneChanged ||
        birthdayChanged ||
        notesChanged
    );
  }, [
    firstName,
    lastName,
    description,
    email,
    phone,
    birthday,
    notesContent,
    editorBaselineCaptured,
  ]);

  const handleSave = useCallback(async () => {
    if (!contact || isSaving) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const currentNotes = notesContent
        ? serializeNotesContent(notesContent)
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
        setHasUnsavedChanges(false);
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

  const handleCategoryChange = useCallback(
    async (categoryId: string | null) => {
      if (!contact) return;
      setIsSavingCategory(true);
      try {
        await update({ category_id: categoryId });
      } finally {
        setIsSavingCategory(false);
      }
    },
    [contact, update]
  );

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("back");
      return;
    }
    router.push("/");
  }, [router, hasUnsavedChanges]);

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
      router.push("/");
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
  }, [pendingAction, router, refresh]);

  const handleDelete = useCallback(() => {
    setIsDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeletingContact(true);
    try {
      const success = await remove();
      if (success) {
        router.push("/");
      }
    } finally {
      setIsDeletingContact(false);
      setIsDeleteOpen(false);
    }
  }, [remove, router]);

  // Handle notes change: capture editor baseline on first emission, then compare values
  const handleNotesChange = useCallback((content: JSONContent) => {
    const serialized = serializeNotesContent(content);

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

  // Error state
  if (error || !contact) {
    return (
      <div className="py-24 text-center">
        <p className="text-destructive mb-4">{error ?? "Contact not found"}</p>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => router.push("/")}
        >
          Back to Contacts
        </button>
      </div>
    );
  }

  return (
    <>
      <ContactEditorCommandBar
        onBack={handleBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        saveStatus={saveStatus}
        onDelete={handleDelete}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col-reverse gap-6 md:flex-row md:gap-8">
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
                placeholder="e.g., Cousin, Project Manager at Acme"
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

            {/* Linked task entities (bidirectional link/unlink) */}
            <TaskLinksPanel contactId={contactId} />
          </div>

          {/* Right column: Action panel */}
          <ContactActionPanel
            contact={contact}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            onCategoryChange={handleCategoryChange}
            isSavingCategory={isSavingCategory}
          />
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
