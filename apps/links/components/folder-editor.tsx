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
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import { E2EE_EDITOR_FORM_BODY_STACK_CLASS } from "@helvety/ui/e2ee-form-layout";
import { Input } from "@helvety/ui/input";
import { NativeSelect } from "@helvety/ui/native-select";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LinksFormField } from "@/components/link-form-fields";
import { LinksEditorCommandBar } from "@/components/links-editor-command-bar";
import {
  ALL_FOLDER_ID,
  toDisplayFolderId,
  toStorageFolderId,
} from "@/lib/all-folder";
import { canMoveFolderToParent } from "@/lib/link-tree";

import type { LinkFolder } from "@/lib/types";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the folder editor panel. */
interface FolderEditorProps {
  folder: LinkFolder;
  folders: LinkFolder[];
  embedded?: boolean;
  onClose?: () => void;
  onSave: (input: {
    name: string;
    parent_folder_id: string | null;
  }) => Promise<boolean>;
  onDelete?: () => void;
  onRefresh?: () => Promise<void>;
}

/**
 * Folder detail editor with pinned save bar and unsaved-change detection.
 */
export function FolderEditor({
  folder,
  folders,
  embedded = false,
  onClose,
  onSave,
  onDelete,
  onRefresh,
}: FolderEditorProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState("");
  const [baselineCaptured, setBaselineCaptured] = useState(false);
  const savedNameRef = useRef("");
  const savedParentFolderIdRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    if (!baselineCaptured) {
      setName(folder.name);
      setParentFolderId(toDisplayFolderId(folder.parent_folder_id) ?? "");
      savedNameRef.current = folder.name;
      savedParentFolderIdRef.current = folder.parent_folder_id;
      setBaselineCaptured(true);
      setSaveStatus("idle");
    }
  }, [baselineCaptured, folder]);

  const parentOptions = useMemo(
    () =>
      folders.filter(
        (f) =>
          f.id !== folder.id && canMoveFolderToParent(folders, folder.id, f.id)
      ),
    [folder.id, folders]
  );

  const targetParentId = toStorageFolderId(parentFolderId);
  const parentMoveAllowed = canMoveFolderToParent(
    folders,
    folder.id,
    targetParentId ?? ALL_FOLDER_ID
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!baselineCaptured) {
      return false;
    }
    return (
      name.trim() !== savedNameRef.current ||
      targetParentId !== savedParentFolderIdRef.current
    );
  }, [baselineCaptured, name, targetParentId]);

  const captureBaseline = useCallback(
    (nextName: string, nextParentId: string | null) => {
      savedNameRef.current = nextName;
      savedParentFolderIdRef.current = nextParentId;
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (isSaving || name.trim().length === 0 || !parentMoveAllowed) {
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const trimmedName = name.trim();
      const success = await onSave({
        name: trimmedName,
        parent_folder_id: targetParentId,
      });

      if (success) {
        captureBaseline(trimmedName, targetParentId);
        setSaveStatus("saved");
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [
    captureBaseline,
    isSaving,
    name,
    onSave,
    parentMoveAllowed,
    targetParentId,
  ]);

  const doBack = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("back");
      return;
    }
    doBack();
  }, [doBack, hasUnsavedChanges]);

  const runRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setBaselineCaptured(false);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handleRefresh = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction("refresh");
      return;
    }
    void runRefresh();
  }, [hasUnsavedChanges, runRefresh]);

  const handleConfirmDiscard = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === "back") {
      doBack();
      return;
    }
    if (action === "refresh") {
      void runRefresh();
    }
  }, [doBack, pendingAction, runRefresh]);

  return (
    <>
      <CommandBarPageLayout
        className={embedded ? "min-h-0 flex-1" : undefined}
        commandBar={
          <LinksEditorCommandBar
            onBack={handleBack}
            showBack={!embedded}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onSave={() => void handleSave()}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            saveStatus={saveStatus}
            onDelete={onDelete}
            deleteLabel="Delete folder"
          />
        }
      >
        <div className={E2EE_EDITOR_FORM_BODY_STACK_CLASS}>
          <LinksFormField label="Name" htmlFor="edit-folder-name">
            <Input
              id="edit-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </LinksFormField>
          <LinksFormField label="Parent folder" htmlFor="edit-folder-parent">
            <NativeSelect
              id="edit-folder-parent"
              value={parentFolderId}
              onChange={(e) => setParentFolderId(e.target.value)}
            >
              <option value={ALL_FOLDER_ID}>All</option>
              {parentOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </NativeSelect>
            {!parentMoveAllowed ? (
              <p className="text-destructive text-sm">
                Cannot move a folder into itself or a subfolder.
              </p>
            ) : null}
          </LinksFormField>
        </div>
      </CommandBarPageLayout>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits. If you continue, your changes will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
