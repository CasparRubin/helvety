"use client";

import { useRichTextDraftState } from "@helvety/shared/hooks/use-rich-text-draft-state";
import { cn } from "@helvety/shared/utils";
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
import { Card, CardContent } from "@helvety/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@helvety/ui/collapsible";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import { E2EE_UNSAVED_CHANGES_DIALOG } from "@helvety/ui/e2ee-form-layout";
import { renderIcon } from "@helvety/ui/icon-renderer";
import { Input } from "@helvety/ui/input";
import {
  parseRichTextContent,
  serializeRichTextContent,
} from "@helvety/ui/tiptap-utils";
import { useIsMobile } from "@helvety/ui/use-is-mobile";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ItemCommandBar } from "@/components/item-command-bar";
import { useItem } from "@/hooks/use-items";
import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";

import type { Item, ItemRow } from "@/lib/types";
import type { TiptapEditorRef } from "@helvety/ui/tiptap-editor";
import type { JSONContent } from "@tiptap/react";

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

const ContactLinksPanel = dynamic(
  () =>
    import("@/components/contact-links-panel").then((m) => m.ContactLinksPanel),
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

/**
 * Save status for the editor
 */
type SaveStatus = "idle" | "saving" | "saved" | "error";
const APP_HOME_PATH = "/notes";

/**
 * Note editor for title and description. Used inside the dashboard detail sheet
 * (`embedded`); supports a legacy full-page layout when `embedded` is false.
 */
export function ItemEditor({
  itemId,
  initialItem,
  initialEncryptedItem,
  embedded = false,
  onClose,
  onLocalPatch,
}: {
  itemId: string;
  initialItem?: Item;
  initialEncryptedItem?: ItemRow;
  embedded?: boolean;
  onClose?: () => void;
  onLocalPatch?: (id: string, input: { category_id?: string }) => void;
}) {
  const router = useRouter();
  const {
    item,
    isLoading: isLoadingItem,
    error,
    update,
    refresh,
    remove,
  } = useItem(itemId, {
    initialData: initialItem,
    initialEncryptedData: initialEncryptedItem,
  });

  // Local state for editing
  const [title, setTitle] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Delete item state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const isMobile = useIsMobile();
  const [categoryOverride, setCategoryOverride] = useState<boolean | null>(
    null
  );
  const categoryOpen = categoryOverride ?? !isMobile;

  // Unsaved changes confirmation state
  const [pendingAction, setPendingAction] = useState<"back" | "refresh" | null>(
    null
  );

  const draftState = useRichTextDraftState();

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  // Initialize form with item data
  useEffect(() => {
    if (item && !hasInitialized) {
      setTitle(item.title);
      draftState.initializeTitle(item.title);
      // Description baseline is captured on first Tiptap editor emission.
      setHasInitialized(true);
    }
  }, [item, hasInitialized, draftState]);

  // Save function
  const save = useCallback(
    async (newTitle: string, newDescription: JSONContent | null) => {
      setSaveStatus("saving");

      const descriptionString = newDescription
        ? serializeRichTextContent(newDescription)
        : null;

      const success = await update({
        title: newTitle,
        description: descriptionString,
      });

      if (success) {
        draftState.markSaved(
          newTitle,
          newDescription ? JSON.stringify(newDescription) : null
        );

        setSaveStatus("saved");
        setHasUnsavedChanges(false);
        // Reset to idle after a short delay
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } else {
        setSaveStatus("error");
      }
    },
    [update, draftState]
  );

  // Handle title change: compare against saved value to determine dirty state
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      if (hasInitialized) {
        const currentDescJson = editorRef.current?.getJSON();
        const currentDescSerialized = currentDescJson
          ? JSON.stringify(currentDescJson)
          : null;
        setHasUnsavedChanges(
          draftState.isDirty(newTitle, currentDescSerialized)
        );
      }
    },
    [hasInitialized, draftState]
  );

  // Handle description change: capture editor baseline on first emission, then compare values
  const handleDescriptionChange = useCallback(
    (content: JSONContent) => {
      const serialized = JSON.stringify(content);

      // On the first emission after mount/refresh, capture the editor's normalized
      // output as the baseline. This accounts for any content normalization TiptapEditor
      // performs on the initial content (e.g., adding empty paragraphs, restructuring).
      if (draftState.captureEditorBaseline(serialized)) {
        return;
      }

      if (hasInitialized) {
        setHasUnsavedChanges(draftState.isDirty(title, serialized));
      }
    },
    [hasInitialized, title, draftState]
  );

  // Manual save (for button in command bar)
  const handleManualSave = useCallback(async () => {
    if (!title.trim()) return;

    const currentContent = editorRef.current?.getJSON() ?? null;
    await save(title, currentContent);
  }, [title, save]);

  // Actual back navigation (no confirmation)
  const doBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.replace(APP_HOME_PATH);
  }, [onClose, router]);

  // Actual refresh (no confirmation)
  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset initialization state so form re-initializes with new data
      setHasInitialized(false);
      setHasUnsavedChanges(false);
      // Reset baseline so the next TiptapEditor emission is captured as the new baseline
      draftState.resetDescriptionBaselineCapture();
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, draftState]);

  // Handle back navigation - confirms if unsaved changes
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("back");
    } else {
      doBack();
    }
  }, [hasUnsavedChanges, doBack]);

  // Handle refresh - confirms if unsaved changes
  const handleRefresh = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("refresh");
    } else {
      void doRefresh();
    }
  }, [hasUnsavedChanges, doRefresh]);

  // Handle confirming the pending action (discard unsaved changes)
  const handleConfirmDiscard = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === "back") {
      doBack();
    } else if (action === "refresh") {
      void doRefresh();
    }
  }, [pendingAction, doBack, doRefresh]);

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      if (!item || categoryId === item.category_id) return;
      const previousCategoryId = item.category_id;
      onLocalPatch?.(item.id, { category_id: categoryId });
      setIsSavingCategory(true);
      try {
        const success = await update({ category_id: categoryId });
        if (!success) {
          onLocalPatch?.(item.id, { category_id: previousCategoryId });
        }
      } finally {
        setIsSavingCategory(false);
      }
    },
    [item, onLocalPatch, update]
  );

  // Handle delete item
  const handleDeleteItem = useCallback(async () => {
    setIsDeleting(true);
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
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }, [onClose, remove, router]);

  // Loading state: only show spinner on initial load, not during refresh after save
  // (refresh sets isLoading=true which would unmount TiptapEditor and cause false dirty state)
  if (isLoadingItem && !hasInitialized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  const pageLayoutClassName = embedded ? "min-h-0 flex-1" : undefined;

  // Error state - friendly UI with retry (toast already shown by hooks)
  if (error || !item) {
    return (
      <CommandBarPageLayout
        className={pageLayoutClassName}
        commandBar={
          <ItemCommandBar
            onBack={handleBack}
            showBack={!embedded}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        }
      >
        <div className="container mx-auto px-4 py-8">
          <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
            <p className="text-muted-foreground text-sm">
              {error
                ? "Couldn't load this note. Please try again."
                : "Note not found"}
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        </div>
      </CommandBarPageLayout>
    );
  }

  return (
    <>
      <CommandBarPageLayout
        className={pageLayoutClassName}
        commandBar={
          <ItemCommandBar
            onBack={handleBack}
            showBack={!embedded}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onSave={handleManualSave}
            isSaving={saveStatus === "saving"}
            hasUnsavedChanges={hasUnsavedChanges}
            saveStatus={saveStatus}
            onDelete={() => setIsDeleteOpen(true)}
            deleteLabel="Delete Note"
          />
        }
      >
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb removed: list opens this sheet (no in-app hierarchy). */}

          <div className="flex flex-col gap-6">
            <div className="min-w-0">
              {/* Title input */}
              <div className="mb-6">
                {embedded ? (
                  <Input
                    id="item-title"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Note title..."
                  />
                ) : (
                  <input
                    id="item-title"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Note title..."
                    className="placeholder:text-muted-foreground w-full bg-transparent py-4 text-2xl leading-tight font-bold outline-none md:text-4xl"
                  />
                )}
              </div>

              {/* Description editor */}
              <div className="mb-6">
                <TiptapEditor
                  ref={editorRef}
                  content={parseRichTextContent(item.description)}
                  onChange={handleDescriptionChange}
                  placeholder="Add a description... Use the toolbar above for formatting."
                />
              </div>

              <div className="mb-6">
                <Card size="sm" className="bg-surface-panel">
                  <CardContent>
                    <Collapsible
                      open={categoryOpen}
                      onOpenChange={setCategoryOverride}
                    >
                      <CollapsibleTrigger className="group flex w-full items-center justify-between">
                        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                          Category
                          {isSavingCategory && (
                            <Loader2Icon className="size-3 animate-spin" />
                          )}
                        </h3>
                        <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 flex flex-col gap-1">
                          {DEFAULT_NOTE_CATEGORIES.map((category) => {
                            const isActive = item.category_id === category.id;
                            return (
                              <Button
                                key={category.id}
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSavingCategory}
                                className={cn(
                                  "h-auto justify-start gap-2 px-2.5 py-1.5",
                                  isActive && "ring-ring/30 bg-muted ring-1"
                                )}
                                style={
                                  isActive
                                    ? { backgroundColor: `${category.color}18` }
                                    : undefined
                                }
                                onClick={() => {
                                  void handleCategoryChange(category.id);
                                }}
                              >
                                {renderIcon(category.icon, "size-4 shrink-0", {
                                  color:
                                    category.color ?? "var(--muted-foreground)",
                                })}
                                <span
                                  className={cn(
                                    "truncate text-sm",
                                    isActive ? "font-medium" : "font-normal"
                                  )}
                                >
                                  {category.name}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </div>

              {!embedded && (
                <div className="mb-6 space-y-6">
                  <TaskLinksPanel noteId={itemId} />
                  <ContactLinksPanel itemId={itemId} />
                </div>
              )}
            </div>

            {embedded && (
              <div className="w-full space-y-6">
                <TaskLinksPanel noteId={itemId} />
                <ContactLinksPanel itemId={itemId} />
              </div>
            )}
          </div>
        </div>
      </CommandBarPageLayout>

      {/* Delete Note Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        entityType="item"
        entityName={item.title}
        onConfirm={handleDeleteItem}
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {E2EE_UNSAVED_CHANGES_DIALOG.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {E2EE_UNSAVED_CHANGES_DIALOG.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {E2EE_UNSAVED_CHANGES_DIALOG.cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDiscard}
            >
              {E2EE_UNSAVED_CHANGES_DIALOG.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
