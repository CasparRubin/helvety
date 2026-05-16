"use client";

import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { NativeSelect } from "@helvety/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  LINKS_SHEET_CONTENT_CLASS,
  LINKS_SHEET_FOOTER_ACTIONS_CLASS,
  LinksFormField,
  LinksSheetBody,
} from "@/components/link-form-fields";

import type { LinkFolder } from "@/lib/types";

/**
 *
 */
interface FolderCreateSheetProps {
  open: boolean;
  folders: LinkFolder[];
  defaultParentFolderId: string | null;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; parent_folder_id: string | null }) => void;
}

/**
 *
 */
export function FolderCreateSheet({
  open,
  folders,
  defaultParentFolderId,
  isCreating,
  onOpenChange,
  onCreate,
}: FolderCreateSheetProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [parentFolderId, setParentFolderId] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setParentFolderId(defaultParentFolderId ?? "");
    }
  }, [defaultParentFolderId, open]);

  const canCreate = name.trim().length > 0 && !isCreating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={LINKS_SHEET_CONTENT_CLASS}>
        <SheetHeader className="shrink-0">
          <SheetTitle>New folder</SheetTitle>
          <SheetDescription>
            Folders can contain links and other folders.
          </SheetDescription>
        </SheetHeader>
        <LinksSheetBody>
          <LinksFormField label="Name" htmlFor="new-folder-name">
            <Input
              id="new-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              autoFocus
              placeholder="e.g. Reading list"
            />
          </LinksFormField>
          <LinksFormField label="Parent folder" htmlFor="new-folder-parent">
            <NativeSelect
              id="new-folder-parent"
              value={parentFolderId}
              onChange={(e) => setParentFolderId(e.target.value)}
            >
              <option value="">Root</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </NativeSelect>
          </LinksFormField>
        </LinksSheetBody>
        <SheetFooter className={LINKS_SHEET_FOOTER_ACTIONS_CLASS}>
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canCreate}
            onClick={() =>
              onCreate({
                name: name.trim(),
                parent_folder_id: parentFolderId ? parentFolderId : null,
              })
            }
          >
            {isCreating ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : null}
            Create folder
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
