"use client";

import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { NativeSelect } from "@helvety/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  LINKS_SHEET_CONTENT_CLASS,
  LINKS_SHEET_FOOTER_ACTIONS_CLASS,
  LinksFormField,
  LinksSheetBody,
} from "@/components/link-form-fields";
import { canMoveFolderToParent } from "@/lib/link-tree";

import type { LinkFolder } from "@/lib/types";

/**
 *
 */
interface FolderEditorSheetProps {
  open: boolean;
  folder: LinkFolder | null;
  folders: LinkFolder[];
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    name: string;
    parent_folder_id: string | null;
  }) => Promise<boolean>;
  onDelete?: () => void;
  isSaving: boolean;
  isDeleting?: boolean;
}

/**
 *
 */
export function FolderEditorSheet({
  open,
  folder,
  folders,
  onOpenChange,
  onSave,
  onDelete,
  isSaving,
  isDeleting = false,
}: FolderEditorSheetProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState("");

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setParentFolderId(folder.parent_folder_id ?? "");
    }
  }, [folder]);

  const parentOptions = useMemo(() => {
    if (!folder) {
      return folders;
    }
    return folders.filter(
      (f) =>
        f.id !== folder.id && canMoveFolderToParent(folders, folder.id, f.id)
    );
  }, [folder, folders]);

  const targetParentId = parentFolderId ? parentFolderId : null;
  const parentMoveAllowed =
    !folder || canMoveFolderToParent(folders, folder.id, targetParentId);

  const canSave =
    name.trim().length > 0 && parentMoveAllowed && !isSaving && !isDeleting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={LINKS_SHEET_CONTENT_CLASS}>
        <SheetHeader className="shrink-0">
          <SheetTitle>Folder details</SheetTitle>
        </SheetHeader>
        <LinksSheetBody>
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
              <option value="">Root</option>
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
        </LinksSheetBody>
        <SheetFooter className="gap-4">
          {onDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:mr-auto sm:w-auto"
              disabled={isSaving || isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              Delete folder
            </Button>
          ) : null}
          <div className={LINKS_SHEET_FOOTER_ACTIONS_CLASS}>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || isDeleting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              onClick={() =>
                void onSave({
                  name: name.trim(),
                  parent_folder_id: targetParentId,
                })
              }
            >
              {isSaving ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
