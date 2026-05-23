"use client";

import { useRichTextDraftState } from "@helvety/shared/hooks/use-rich-text-draft-state";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";
import { CommandBarPageLayout } from "./command-bar-page-layout";
import { E2EE_UNSAVED_CHANGES_DIALOG } from "./e2ee-form-layout";
import { Input } from "./input";
import { Label } from "./label";
import { parseRichTextContent, serializeRichTextContent } from "./tiptap-utils";

import type { TiptapEditorRef } from "./tiptap-editor";
import type { JSONContent } from "@tiptap/react";
import type { ReactNode } from "react";

const TiptapEditor = dynamic(
  () => import("./tiptap-editor").then((m) => m.TiptapEditor),
  {
    ssr: false,
    loading: () => <EditorLoadingSpinner />,
  }
);

/** Loading placeholder while the rich-text editor chunk loads. */
function EditorLoadingSpinner() {
  return (
    <div className="border-border/40 flex min-h-[200px] items-center justify-center rounded-md border">
      <Loader2Icon className="text-muted-foreground h-6 w-6 animate-spin" />
    </div>
  );
}

/** Save status for the editor shell. */
export type E2eeItemEditorSaveStatus = "idle" | "saving" | "saved" | "error";

/** Shared rich-text item editor shell for tasks and notes (detail sheet only). */
export interface E2eeRichTextItemEditorShellProps {
  title: string;
  description: string | null;
  isLoading: boolean;
  hasItem: boolean;
  error: string | null;
  hasInitialized: boolean;
  onTitleChange: (title: string) => void;
  onSave: (title: string, description: JSONContent | null) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  titlePlaceholder: string;
  notFoundMessage: string;
  loadErrorMessage: string;
  onDeleteRequested?: () => void;
  /** When true, omits the default title input (e.g. contacts use renderMetadata for fields). */
  hideTitle?: boolean;
  /** When false, save is allowed with an empty title. Defaults to true. */
  requireTitle?: boolean;
  /** Extra dirty state outside title + rich text (e.g. contact metadata fields). */
  hasAdditionalUnsavedChanges?: boolean;
  /** Optional label shown above the rich-text editor. */
  richTextLabel?: ReactNode;
  /** Placeholder for the rich-text editor body. */
  richTextPlaceholder?: string;
  /** Content rendered above the rich-text editor (e.g. contact name fields). */
  renderBeforeEditor?: ReactNode;
  renderCommandBar: (props: {
    onBack: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    onSave: () => void;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    saveStatus: E2eeItemEditorSaveStatus;
    onDelete: () => void;
    showBack: boolean;
  }) => ReactNode;
  renderMetadata?: ReactNode;
  renderLinks?: ReactNode;
  deleteDialog: ReactNode;
}

/**
 * Shared editor shell: title, Tiptap body, unsaved-changes dialog, and layout slots.
 */
export function E2eeRichTextItemEditorShell({
  title,
  description,
  isLoading,
  hasItem,
  error,
  hasInitialized,
  onTitleChange,
  onSave,
  onRefresh,
  onBack,
  titlePlaceholder,
  notFoundMessage,
  loadErrorMessage,
  onDeleteRequested,
  hideTitle = false,
  requireTitle = true,
  hasAdditionalUnsavedChanges = false,
  richTextLabel,
  richTextPlaceholder = "Add a description... Use the toolbar above for formatting.",
  renderBeforeEditor,
  renderCommandBar,
  renderMetadata,
  renderLinks,
  deleteDialog,
}: E2eeRichTextItemEditorShellProps) {
  const editorRef = useRef<TiptapEditorRef>(null);
  const draftState = useRichTextDraftState();
  const [saveStatus, setSaveStatus] =
    useState<E2eeItemEditorSaveStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState<"back" | "refresh" | null>(
    null
  );
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasInitialized) {
      draftState.initializeTitle(title);
    }
  }, [hasInitialized, title, draftState]);

  const persistSave = useCallback(
    async (newTitle: string, newDescription: JSONContent | null) => {
      setSaveStatus("saving");
      const success = await onSave(newTitle, newDescription);
      if (success) {
        draftState.markSaved(
          newTitle,
          newDescription ? JSON.stringify(newDescription) : null
        );
        setSaveStatus("saved");
        setHasUnsavedChanges(false);
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
    [draftState, onSave]
  );

  const handleTitleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      onTitleChange(newTitle);
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
    [hasInitialized, onTitleChange, draftState]
  );

  const handleDescriptionChange = useCallback(
    (content: JSONContent) => {
      const serialized = JSON.stringify(content);
      if (draftState.captureEditorBaseline(serialized)) {
        return;
      }
      if (hasInitialized) {
        setHasUnsavedChanges(draftState.isDirty(title, serialized));
      }
    },
    [hasInitialized, title, draftState]
  );

  const handleManualSave = useCallback(async () => {
    if (requireTitle && !title.trim()) return;
    const currentContent = editorRef.current?.getJSON() ?? null;
    await persistSave(title, currentContent);
  }, [requireTitle, title, persistSave]);

  const combinedUnsavedChanges =
    hasUnsavedChanges || hasAdditionalUnsavedChanges;

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      draftState.resetDescriptionBaselineCapture();
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [draftState, onRefresh]);

  const handleRefresh = useCallback(() => {
    if (combinedUnsavedChanges) {
      setPendingAction("refresh");
    } else {
      void doRefresh();
    }
  }, [combinedUnsavedChanges, doRefresh]);

  const handleBack = useCallback(() => {
    if (combinedUnsavedChanges) {
      setPendingAction("back");
    } else {
      onBack();
    }
  }, [combinedUnsavedChanges, onBack]);

  const handleConfirmDiscard = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === "back") {
      onBack();
    } else if (action === "refresh") {
      void doRefresh();
    }
  }, [pendingAction, onBack, doRefresh]);

  const commandBar = renderCommandBar({
    onBack: handleBack,
    onRefresh: handleRefresh,
    isRefreshing,
    onSave: () => {
      void handleManualSave();
    },
    isSaving: saveStatus === "saving",
    hasUnsavedChanges: combinedUnsavedChanges,
    saveStatus,
    onDelete: () => onDeleteRequested?.(),
    showBack: false,
  });

  if (isLoading && !hasInitialized) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (error || !hasItem) {
    return (
      <CommandBarPageLayout className="min-h-0 flex-1" commandBar={commandBar}>
        <EditorErrorPanel
          message={error ? loadErrorMessage : notFoundMessage}
          onRetry={handleRefresh}
        />
      </CommandBarPageLayout>
    );
  }

  return (
    <>
      <CommandBarPageLayout className="min-h-0 flex-1" commandBar={commandBar}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="min-w-0 flex-1 space-y-6">
              {renderBeforeEditor}
              {!hideTitle ? (
                <Input
                  id="item-title"
                  value={title}
                  onChange={handleTitleInputChange}
                  placeholder={titlePlaceholder}
                />
              ) : null}
              <div className={richTextLabel ? "grid gap-2" : undefined}>
                {richTextLabel ? (
                  typeof richTextLabel === "string" ? (
                    <Label>{richTextLabel}</Label>
                  ) : (
                    richTextLabel
                  )
                ) : null}
                <TiptapEditor
                  ref={editorRef}
                  content={parseRichTextContent(description)}
                  onChange={handleDescriptionChange}
                  placeholder={richTextPlaceholder}
                />
              </div>
            </div>
            {renderMetadata}
            {renderLinks ? (
              <EditorLinksSection>{renderLinks}</EditorLinksSection>
            ) : null}
          </div>
        </div>
      </CommandBarPageLayout>

      {deleteDialog}

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

/** Error panel shown when the item failed to load. */
function EditorErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

/** Wrapper spacing for linked-entity panels below the editor. */
function EditorLinksSection({ children }: { children: ReactNode }) {
  return <div className="mb-6 space-y-6">{children}</div>;
}

/** Adapts shell save to encrypted item `update` (title + serialized description). */
export function useE2eeRichTextItemEditorSave({
  update,
}: {
  update: (input: {
    title: string;
    description: string | null;
  }) => Promise<boolean>;
}) {
  return useCallback(
    async (newTitle: string, newDescription: JSONContent | null) => {
      const descriptionString = newDescription
        ? serializeRichTextContent(newDescription)
        : null;
      return update({ title: newTitle, description: descriptionString });
    },
    [update]
  );
}
