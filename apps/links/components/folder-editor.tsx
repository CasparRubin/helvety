"use client";

import { emptyLinkFolderInput } from "@helvety/shared/e2ee-create-inputs";
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
import {
  E2EE_EDITOR_FORM_BODY_STACK_CLASS,
  E2EE_UNSAVED_CHANGES_DIALOG,
} from "@helvety/ui/e2ee-form-layout";
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

/** Shared props for folder editor create and edit modes. */
type FolderEditorBaseProps = {
  folders: LinkFolder[];
  onClose?: () => void;
  onRefresh?: () => Promise<void>;
};

/** Save-first create mode: inserts on first save via library hook. */
type FolderEditorCreateProps = FolderEditorBaseProps & {
  formMode: "create";
  defaultParentFolderId: string | null;
  onCreate: (input: {
    name: string;
    parent_folder_id: string | null;
  }) => Promise<{ id: string } | null>;
  onCreated: (id: string) => void;
};

/** Edit mode: dashboard supplies the resolved folder and save/delete callbacks. */
type FolderEditorEditProps = FolderEditorBaseProps & {
  formMode: "edit";
  folder: LinkFolder;
  onSave: (input: {
    name: string;
    parent_folder_id: string | null;
  }) => Promise<boolean>;
  onDelete?: () => void;
};

/** Props for the folder editor panel. */
export type FolderEditorProps = FolderEditorCreateProps | FolderEditorEditProps;

/**
 * Folder detail editor with pinned save bar and unsaved-change detection.
 */
export function FolderEditor(props: FolderEditorProps): React.JSX.Element {
  const { formMode, folders, onClose, onRefresh } = props;
  const folder = formMode === "edit" ? props.folder : null;

  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
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
    if (formMode === "create" && !hasInitialized) {
      const defaults = emptyLinkFolderInput();
      const initialParentId =
        props.defaultParentFolderId ?? defaults.parent_folder_id ?? null;
      setName(defaults.name);
      setParentFolderId(toDisplayFolderId(initialParentId) ?? "");
      savedNameRef.current = defaults.name;
      savedParentFolderIdRef.current = initialParentId;
      setHasInitialized(true);
      setSaveStatus("idle");
      return;
    }
    if (formMode === "edit" && folder && !hasInitialized) {
      setName(folder.name);
      setParentFolderId(toDisplayFolderId(folder.parent_folder_id) ?? "");
      savedNameRef.current = folder.name;
      savedParentFolderIdRef.current = folder.parent_folder_id;
      setHasInitialized(true);
      setSaveStatus("idle");
    }
  }, [folder, formMode, hasInitialized, props]);

  const parentOptions = useMemo(() => {
    if (formMode === "create") {
      return folders;
    }
    return folders.filter(
      (f) =>
        f.id !== folder?.id && canMoveFolderToParent(folders, folder!.id, f.id)
    );
  }, [folder, folders, formMode]);

  const targetParentId = toStorageFolderId(parentFolderId);
  const parentMoveAllowed =
    formMode === "create" ||
    canMoveFolderToParent(folders, folder!.id, targetParentId ?? ALL_FOLDER_ID);

  const hasUnsavedChanges = useMemo(() => {
    if (!hasInitialized) {
      return false;
    }
    return (
      name.trim() !== savedNameRef.current ||
      targetParentId !== savedParentFolderIdRef.current
    );
  }, [hasInitialized, name, targetParentId]);

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
      const input = {
        name: trimmedName,
        parent_folder_id: targetParentId,
      };

      if (formMode === "create") {
        const created = await props.onCreate(input);
        if (created) {
          captureBaseline(trimmedName, targetParentId);
          setSaveStatus("saved");
          props.onCreated(created.id);
        } else {
          setSaveStatus("error");
        }
        return;
      }

      const success = await props.onSave(input);

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
    formMode,
    isSaving,
    name,
    parentMoveAllowed,
    props,
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
    if (formMode !== "edit") {
      return;
    }
    setIsRefreshing(true);
    setHasInitialized(false);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [formMode, onRefresh]);

  const handleRefresh = useCallback(() => {
    if (formMode !== "edit") {
      return;
    }
    if (hasUnsavedChanges) {
      setPendingAction("refresh");
      return;
    }
    void runRefresh();
  }, [formMode, hasUnsavedChanges, runRefresh]);

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
        className="min-h-0 flex-1"
        commandBar={
          <LinksEditorCommandBar
            onBack={handleBack}
            showBack={false}
            onRefresh={formMode === "edit" ? handleRefresh : undefined}
            isRefreshing={isRefreshing}
            onSave={() => void handleSave()}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            saveStatus={saveStatus}
            onDelete={formMode === "edit" ? props.onDelete : undefined}
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
