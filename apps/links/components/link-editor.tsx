"use client";

import { emptyLinkInput } from "@helvety/shared/e2ee-create-inputs";
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
  E2EE_EDITOR_FORM_BODY_CLASS,
  E2EE_UNSAVED_CHANGES_DIALOG,
} from "@helvety/ui/e2ee-form-layout";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LinkFormFields } from "@/components/link-form-fields";
import { LinksEditorCommandBar } from "@/components/links-editor-command-bar";
import { toDisplayFolderId, toStorageFolderId } from "@/lib/all-folder";

import type { Link, LinkFolder } from "@/lib/types";

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

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Shared props for link editor create and edit modes. */
type LinkEditorBaseProps = {
  folders: LinkFolder[];
  onClose?: () => void;
  onRefresh?: () => Promise<void>;
};

/** Save-first create mode: inserts on first save via library hook. */
type LinkEditorCreateProps = LinkEditorBaseProps & {
  formMode: "create";
  defaultFolderId: string | null;
  onCreate: (input: {
    name: string;
    url: string;
    folder_id: string | null;
  }) => Promise<{ id: string } | null>;
  onCreated: (id: string) => void;
};

/** Edit mode: dashboard supplies the resolved link and save/delete callbacks. */
type LinkEditorEditProps = LinkEditorBaseProps & {
  formMode: "edit";
  link: Link;
  onSave: (input: {
    name: string;
    url: string;
    folder_id: string | null;
  }) => Promise<boolean>;
  onDelete?: () => void;
};

/** Props for the link editor panel. */
export type LinkEditorProps = LinkEditorCreateProps | LinkEditorEditProps;

/**
 * Link detail editor with pinned save bar and unsaved-change detection.
 */
export function LinkEditor(props: LinkEditorProps): React.JSX.Element {
  const { formMode, folders, onClose, onRefresh } = props;
  const link = formMode === "edit" ? props.link : null;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
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
    if (formMode === "create" && !hasInitialized) {
      const defaults = emptyLinkInput();
      const initialFolderId =
        props.defaultFolderId ?? defaults.folder_id ?? null;
      setName(defaults.name);
      setUrl(defaults.url);
      setFolderId(toDisplayFolderId(initialFolderId) ?? "");
      savedNameRef.current = defaults.name;
      savedUrlRef.current = defaults.url;
      savedFolderIdRef.current = initialFolderId;
      setHasInitialized(true);
      setSaveStatus("idle");
      return;
    }
    if (formMode === "edit" && link && !hasInitialized) {
      setName(link.name);
      setUrl(link.url);
      setFolderId(toDisplayFolderId(link.folder_id) ?? "");
      savedNameRef.current = link.name;
      savedUrlRef.current = link.url;
      savedFolderIdRef.current = link.folder_id;
      setHasInitialized(true);
      setSaveStatus("idle");
    }
  }, [formMode, hasInitialized, link, props]);

  const folderIdValue = toStorageFolderId(folderId);

  const hasUnsavedChanges = useMemo(() => {
    if (!hasInitialized) {
      return false;
    }
    return (
      name.trim() !== savedNameRef.current ||
      url.trim() !== savedUrlRef.current ||
      folderIdValue !== savedFolderIdRef.current
    );
  }, [folderIdValue, hasInitialized, name, url]);

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
      const input = {
        name: trimmedName,
        url: trimmedUrl,
        folder_id: folderIdValue,
      };

      if (formMode === "create") {
        const created = await props.onCreate(input);
        if (created) {
          captureBaseline(trimmedName, trimmedUrl, folderIdValue);
          setSaveStatus("saved");
          props.onCreated(created.id);
        } else {
          setSaveStatus("error");
        }
        return;
      }

      const success = await props.onSave(input);

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
  }, [captureBaseline, folderIdValue, formMode, isSaving, name, props, url]);

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
            deleteLabel="Delete link"
          />
        }
      >
        <div className={E2EE_EDITOR_FORM_BODY_CLASS}>
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
          {formMode === "edit" && link ? (
            <div className="mb-6 space-y-6">
              <TaskLinksPanel linkId={link.id} />
              <ContactLinksPanel linkId={link.id} />
              <NoteLinksPanel linkId={link.id} />
            </div>
          ) : null}
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
