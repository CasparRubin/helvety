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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LinkFormFields } from "@/components/link-form-fields";
import { LinksEditorCommandBar } from "@/components/links-editor-command-bar";
import { toDisplayFolderId, toStorageFolderId } from "@/lib/all-folder";

import type { Link, LinkFolder } from "@/lib/types";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the link editor panel. */
interface LinkEditorProps {
  link: Link;
  folders: LinkFolder[];
  embedded?: boolean;
  onClose?: () => void;
  onSave: (input: {
    name: string;
    url: string;
    folder_id: string | null;
  }) => Promise<boolean>;
  onDelete?: () => void;
  onRefresh?: () => Promise<void>;
}

/**
 * Link detail editor with pinned save bar and unsaved-change detection.
 */
export function LinkEditor({
  link,
  folders,
  embedded = false,
  onClose,
  onSave,
  onDelete,
  onRefresh,
}: LinkEditorProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState("");
  const [baselineCaptured, setBaselineCaptured] = useState(false);
  const savedNameRef = useRef("");
  const savedUrlRef = useRef("");
  const savedFolderIdRef = useRef<string | null>(null);
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
      setName(link.name);
      setUrl(link.url);
      setFolderId(toDisplayFolderId(link.folder_id) ?? "");
      savedNameRef.current = link.name;
      savedUrlRef.current = link.url;
      savedFolderIdRef.current = link.folder_id;
      setBaselineCaptured(true);
      setSaveStatus("idle");
    }
  }, [baselineCaptured, link]);

  const folderIdValue = toStorageFolderId(folderId);

  const hasUnsavedChanges = useMemo(() => {
    if (!baselineCaptured) {
      return false;
    }
    return (
      name.trim() !== savedNameRef.current ||
      url.trim() !== savedUrlRef.current ||
      folderIdValue !== savedFolderIdRef.current
    );
  }, [baselineCaptured, name, url, folderIdValue]);

  const captureBaseline = useCallback(
    (nextName: string, nextUrl: string, nextFolderId: string | null) => {
      savedNameRef.current = nextName;
      savedUrlRef.current = nextUrl;
      savedFolderIdRef.current = nextFolderId;
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (isSaving || url.trim().length === 0) {
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const trimmedName = name.trim();
      const trimmedUrl = url.trim();
      const success = await onSave({
        name: trimmedName,
        url: trimmedUrl,
        folder_id: folderIdValue,
      });

      if (success) {
        captureBaseline(trimmedName, trimmedUrl, folderIdValue);
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
  }, [captureBaseline, folderIdValue, isSaving, name, onSave, url]);

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
            deleteLabel="Delete link"
          />
        }
      >
        <div className="container mx-auto px-4 py-8">
          <LinkFormFields
            url={url}
            name={name}
            folderId={folderId}
            folders={folders}
            onUrlChange={setUrl}
            onNameChange={setName}
            onFolderIdChange={setFolderId}
            autoFocusUrl
          />
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
